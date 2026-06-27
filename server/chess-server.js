import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.send({ status: 'ok', time: new Date() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Student skills cost dictionary on server for validation
const STUDENT_SKILLS_COST = {
  "arona": 10,
  "plana": 10,
  "10059": 6,  // Mika
  "10004": 6,  // Hina
  "13010": 3,  // Yuuka
  "10005": 4,  // Hoshino
  "10006": 4,  // Iori
  "26003": 3,  // Serina
  "10010": 3,  // Shiroko
  "10013": 4   // Tsurugi
};

// Initial board setup helper
function createInitialBoard(whiteAssignments, blackAssignments) {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  const getPieceData = (side, role) => {
    const config = side === 'white' ? whiteAssignments : blackAssignments;
    const item = config[role];
    return {
      id: `${side}-${role}-${Math.random().toString(36).substring(2, 5)}`,
      role: role,
      side: side,
      studentId: item?.id || '',
      studentName: item?.name || role,
      image: item?.image || '',
      shielded: false,
      frozen: false,
      hasMoved: false
    };
  };

  const backRowOrder = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK'];

  // Black (row 0 & 1)
  for (let c = 0; c < 8; c++) {
    board[0][c] = getPieceData('black', backRowOrder[c]);
    board[1][c] = getPieceData('black', 'PAWN');
  }

  // White (row 6 & 7)
  for (let c = 0; c < 8; c++) {
    board[6][c] = getPieceData('white', 'PAWN');
    board[7][c] = getPieceData('white', backRowOrder[c]);
  }

  return board;
}

// Clear statuses belonging to the team whose turn is beginning
function updateStatusDurations(board, startingSide) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.side === startingSide) {
        piece.shielded = false; // Shields wear off at start of own turn
      }
    }
  }
}

// Clear freeze statuses from a team at the END of their turn
function clearFreezeStatuses(board, endingSide) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.side === endingSide) {
        piece.frozen = false;
      }
    }
  }
}

// Helper to handle Capture or Stun (King Protection) on Server
function serverProcessCaptureOrStun(room, targetR, targetC, attackerSide) {
  const target = room.board[targetR][targetC];
  if (!target || target.side === attackerSide) return false;
  if (target.shielded) return false;

  if (target.role === 'KING') {
    // Stun king instead of capture
    target.frozen = true;
    return 'stunned';
  } else {
    // Normal capture
    room.capturedPieces[target.side].push(target);
    room.board[targetR][targetC] = null;
    return 'captured';
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create room event
  socket.on('create-room', ({ whiteAssignments, blackAssignments }) => {
    const roomId = generateRoomId();
    const roomState = {
      roomId,
      board: createInitialBoard(whiteAssignments, blackAssignments),
      turn: 'white',
      whiteCost: 2,
      blackCost: 2,
      capturedPieces: { white: [], black: [] },
      gameStatus: 'active',
      whiteAssignments,
      blackAssignments,
      players: {
        white: socket.id,
        black: null
      }
    };

    rooms.set(roomId, roomState);
    socket.join(roomId);
    socket.emit('room-created', { roomId, side: 'white', state: roomState });
    console.log(`Room created: ${roomId} by White (${socket.id})`);
  });

  // Join room event
  socket.on('join-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('join-error', 'ไม่พบห้องเล่นเกมนี้ กรุณาตรวจสอบรหัสใหม่อีกครั้งค่ะ');
      return;
    }

    if (room.players.white && room.players.black) {
      socket.emit('join-error', 'ห้องนี้เต็มแล้วค่ะ');
      return;
    }

    let side = '';
    if (!room.players.white) {
      room.players.white = socket.id;
      side = 'white';
    } else {
      room.players.black = socket.id;
      side = 'black';
    }

    socket.join(roomId);
    socket.emit('room-joined', { roomId, side, state: room });
    io.to(roomId).emit('game-state', room);
    console.log(`User ${socket.id} joined Room ${roomId} as ${side}`);
  });

  // Move piece event
  socket.on('move-piece', ({ roomId, from, to }) => {
    const room = rooms.get(roomId);
    if (!room || room.gameStatus !== 'active') return;

    const currentSide = room.turn;
    if (room.players[currentSide] !== socket.id) {
      socket.emit('error-msg', 'ไม่ใช่เทิร์นของคุณค่ะ');
      return;
    }

    const { r: fromR, c: fromC } = from;
    const { r: toR, c: toC } = to;
    const piece = room.board[fromR][fromC];

    if (!piece || piece.side !== currentSide) {
      socket.emit('error-msg', 'หมากไม่ถูกต้อง');
      return;
    }

    if (piece.frozen) {
      socket.emit('error-msg', 'หมากนี้ติดสถานะโดนแช่แข็ง ขยับไม่ได้ในเทิร์นนี้ค่ะ');
      return;
    }

    // Process normal capture
    const destPiece = room.board[toR][toC];
    if (destPiece) {
      if (destPiece.shielded) {
        socket.emit('error-msg', 'หมากเป้าหมายกางบาเรียอยู่ ไม่สามารถกินได้ค่ะ!');
        return;
      }
      
      room.capturedPieces[destPiece.side].push(destPiece);
      
      // King Captured -> Victory
      if (destPiece.role === 'KING') {
        room.gameStatus = currentSide === 'white' ? 'white_win' : 'black_win';
      }
    }

    // Update piece position
    piece.hasMoved = true;
    room.board[toR][toC] = piece;
    room.board[fromR][fromC] = null;

    // Pawn promotion to Queen
    if (piece.role === 'PAWN') {
      if ((piece.side === 'white' && toR === 0) || (piece.side === 'black' && toR === 7)) {
        piece.role = 'QUEEN';
        // Force Hina or Mika based on team
        const id = piece.side === 'white' ? "10059" : "10004";
        piece.studentName = piece.side === 'white' ? "Mika" : "Hina";
        piece.studentId = id;
        piece.image = piece.side === 'white' ? "/images/student/icon/10059.webp" : "/images/student/icon/10004.webp";
      }
    }

    // Clear freeze status for current player at the end of turn
    clearFreezeStatuses(room.board, currentSide);

    // Switch turn
    const nextSide = currentSide === 'white' ? 'black' : 'white';
    room.turn = nextSide;

    // Increment cost
    if (nextSide === 'white') {
      room.whiteCost = Math.min(10, room.whiteCost + 1);
    } else {
      room.blackCost = Math.min(10, room.blackCost + 1);
    }

    // Clear shields for beginning turn
    updateStatusDurations(room.board, nextSide);

    io.to(roomId).emit('game-state', room);
  });

  // Use skill event (Source of Truth validates and updates based on studentId)
  socket.on('use-skill', ({ roomId, from, skillType, targets }) => {
    const room = rooms.get(roomId);
    if (!room || room.gameStatus !== 'active') return;

    const currentSide = room.turn;
    if (room.players[currentSide] !== socket.id) {
      socket.emit('error-msg', 'ไม่ใช่เทิร์นของคุณค่ะ');
      return;
    }

    const { r: fromR, c: fromC } = from;
    const piece = room.board[fromR][fromC];

    if (!piece || piece.side !== currentSide) {
      socket.emit('error-msg', 'หมากไม่ถูกต้อง');
      return;
    }

    if (piece.frozen) {
      socket.emit('error-msg', 'หมากนี้โดนแช่แข็ง ไม่สามารถใช้สกิลได้ค่ะ');
      return;
    }

    const studentId = piece.studentId;
    let skillCost = STUDENT_SKILLS_COST[studentId] || 0;
    let playerCost = currentSide === 'white' ? room.whiteCost : room.blackCost;

    if (playerCost < skillCost) {
      socket.emit('error-msg', 'แต้ม Cost ไม่เพียงพอค่ะ');
      return;
    }

    let skillSuccess = false;

    switch (studentId) {
      // KING: Sensei
      case 'arona':
      case 'plana': {
        const { r: targetR, c: targetC, revivedPawnId } = targets;
        const deadPawns = room.capturedPieces[currentSide].filter(p => p.role === 'PAWN');
        const pawnIndex = deadPawns.findIndex(p => p.id === revivedPawnId);

        if (pawnIndex !== -1 && room.board[targetR][targetC] === null) {
          const revivedPawn = deadPawns[pawnIndex];
          const capturedListIndex = room.capturedPieces[currentSide].findIndex(p => p.id === revivedPawnId);
          room.capturedPieces[currentSide].splice(capturedListIndex, 1);

          revivedPawn.shielded = false;
          revivedPawn.frozen = false;
          revivedPawn.hasMoved = true;
          room.board[targetR][targetC] = revivedPawn;
          skillSuccess = true;
        }
        break;
      }

      // QUEEN: Mika (Kyrie Eleison - Single Snipe)
      case '10059': {
        const { targetR, targetC } = targets;
        serverProcessCaptureOrStun(room, targetR, targetC, currentSide);
        skillSuccess = true;
        break;
      }

      // QUEEN: Hina (End of Babel - Small Fan Wipe)
      case '10004': {
        const { squares } = targets;
        squares.forEach(({ r, c }) => {
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            serverProcessCaptureOrStun(room, r, c, currentSide);
          }
        });
        skillSuccess = true;
        break;
      }

      // ROOK: Yuuka (Calculation Shield)
      case '13010': {
        piece.shielded = true;
        skillSuccess = true;
        break;
      }

      // ROOK: Hoshino (Shield & Stun Adjacent)
      case '10005': {
        piece.shielded = true;
        const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
        dirs.forEach(([dr, dc]) => {
          const nr = fromR + dr;
          const nc = fromC + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = room.board[nr][nc];
            if (target && target.side !== currentSide) {
              target.frozen = true;
            }
          }
        });
        skillSuccess = true;
        break;
      }

      // BISHOP: Iori (Swift Shot)
      case '10006': {
        const { targetR, targetC } = targets;
        serverProcessCaptureOrStun(room, targetR, targetC, currentSide);
        skillSuccess = true;
        break;
      }

      // BISHOP: Serina (Healing Shield)
      case '26003': {
        const { targetR, targetC } = targets;
        const target = room.board[targetR][targetC];
        if (target && target.side === currentSide) {
          target.shielded = true;
          skillSuccess = true;
        }
        break;
      }

      // KNIGHT: Shiroko (Drone Support - L-jump capture + refund 1)
      case '10010': {
        const { targetR, targetC } = targets;
        serverProcessCaptureOrStun(room, targetR, targetC, currentSide);
        
        // Shiroko does NOT move (remote drone strike)
        skillCost = 2; // (3 cost - 1 refund)
        skillSuccess = true;
        break;
      }

      // KNIGHT: Tsurugi (Cleansing Bloodlust - L-jump capture + shield)
      case '10013': {
        const { targetR, targetC } = targets;
        serverProcessCaptureOrStun(room, targetR, targetC, currentSide);
        
        piece.hasMoved = true;
        room.board[targetR][targetC] = piece;
        room.board[fromR][fromC] = null;
        
        piece.shielded = true;
        skillSuccess = true;
        break;
      }
    }

    if (skillSuccess) {
      if (currentSide === 'white') {
        room.whiteCost = Math.max(0, room.whiteCost - skillCost);
      } else {
        room.blackCost = Math.max(0, room.blackCost - skillCost);
      }

      clearFreezeStatuses(room.board, currentSide);

      const nextSide = currentSide === 'white' ? 'black' : 'white';
      room.turn = nextSide;

      if (nextSide === 'white') {
        room.whiteCost = Math.min(10, room.whiteCost + 1);
      } else {
        room.blackCost = Math.min(10, room.blackCost + 1);
      }

      updateStatusDurations(room.board, nextSide);
      io.to(roomId).emit('game-state', room);
    } else {
      socket.emit('error-msg', 'ใช้สกิลไม่สำเร็จ ตรวจสอบเงื่อนไขอีกครั้งค่ะ');
    }
  });

  // Reset Game event
  socket.on('reset-game', ({ roomId, whiteAssignments, blackAssignments }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.board = createInitialBoard(whiteAssignments || room.whiteAssignments, blackAssignments || room.blackAssignments);
    room.turn = 'white';
    room.whiteCost = 2;
    room.blackCost = 2;
    room.capturedPieces = { white: [], black: [] };
    room.gameStatus = 'active';

    io.to(roomId).emit('game-state', room);
    console.log(`Room ${roomId} has been reset`);
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.white === socket.id || room.players.black === socket.id) {
        const disconnectedSide = room.players.white === socket.id ? 'white' : 'black';
        room.players[disconnectedSide] = null;
        io.to(roomId).emit('opponent-disconnected', { side: disconnectedSide });

        if (!room.players.white && !room.players.black) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (all players left)`);
        }
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Blue Archive Chess Server is running on port ${PORT}`);
});
