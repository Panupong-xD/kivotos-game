import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Swords, Shield, Snowflake, Sparkles, RefreshCw, 
  ArrowLeft, Copy, Check, Info, Crosshair, Heart, Maximize2, Minimize2,
  Search
} from 'lucide-react';
import io from 'socket.io-client';
import { 
  STUDENT_SKILLS,
  ASSIGNABLE_STUDENTS_POOL,
  DEFAULT_WHITE_ASSIGNMENTS, 
  DEFAULT_BLACK_ASSIGNMENTS 
} from './chessConfig.js';
import './BlueArchiveChess.css';

// Socket server URL
const SOCKET_SERVER_URL = 'http://localhost:3001';

export default function BlueArchiveChess({ onBack, soundEnabled }) {
  // Navigation / Setup State
  const [gameMode, setGameMode] = useState(null); // 'local' | 'online' | null
  const [onlinePhase, setOnlinePhase] = useState('lobby'); // 'lobby' | 'arena'
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mySide, setMySide] = useState('white'); // For online: 'white' | 'black'
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Student Customization State
  const [whiteAssignments, setWhiteAssignments] = useState(DEFAULT_WHITE_ASSIGNMENTS);
  const [blackAssignments, setBlackAssignments] = useState(DEFAULT_BLACK_ASSIGNMENTS);
  const [selectingRole, setSelectingRole] = useState(null); // { team: 'white'|'black', role: 'QUEEN'|'ROOK'|... }
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [focusedStudent, setFocusedStudent] = useState(null);

  // Core Game State (Used for Local Mode, synced for Online Mode)
  const [board, setBoard] = useState([]);
  const [turn, setTurn] = useState('white');
  const [whiteCost, setWhiteCost] = useState(2);
  const [blackCost, setBlackCost] = useState(2);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [gameStatus, setGameStatus] = useState('active'); // 'active' | 'white_win' | 'black_win'

  // Selection & Phase State
  const [selectedCell, setSelectedCell] = useState(null); // { r, c }
  const [validMoves, setValidMoves] = useState([]); // Array of { r, c }
  const [skillActive, setSkillActive] = useState(false);
  const [validSkillTargets, setValidSkillTargets] = useState([]); // Array of { r, c }
  const [revivalSelectActive, setRevivalSelectActive] = useState(false);
  const [selectedDeceasedPawn, setSelectedDeceasedPawn] = useState(null); // For revival

  const socketRef = useRef(null);

  // Focus Mode Body Class Toggler
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add('global-focus-mode');
    } else {
      document.body.classList.remove('global-focus-mode');
    }
    return () => {
      document.body.classList.remove('global-focus-mode');
    };
  }, [focusMode]);

  // Socket Connection management
  useEffect(() => {
    if (gameMode !== 'online') {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      autoConnect: false
    });

    socketRef.current.connect();

    socketRef.current.on('connect', () => {
      setSocketConnected(true);
      setSocketError(null);
    });

    socketRef.current.on('connect_error', () => {
      setSocketConnected(false);
      setSocketError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์มัลติเพลเยอร์ได้ค่ะ (กรุณารัน server/chess-server.js ก่อนนะครู)');
    });

    socketRef.current.on('room-created', ({ roomId, side, state }) => {
      setRoomId(roomId);
      setMySide(side);
      setOnlinePhase('arena');
      syncState(state);
    });

    socketRef.current.on('room-joined', ({ roomId, side, state }) => {
      setRoomId(roomId);
      setMySide(side);
      setOnlinePhase('arena');
      setOpponentConnected(true);
      syncState(state);
    });

    socketRef.current.on('game-state', (state) => {
      syncState(state);
      if (state.players.white && state.players.black) {
        setOpponentConnected(true);
      }
    });

    socketRef.current.on('opponent-disconnected', ({ side }) => {
      setOpponentConnected(false);
      alert(`ผู้เล่นฝั่ง ${side === 'white' ? 'ขาว (ครู SCHALE)' : 'ดำ (ครูฝ่ายตรงข้าม)'} ออกจากห้องเล่นเกมแล้วค่ะ`);
    });

    socketRef.current.on('error-msg', (msg) => {
      alert(msg);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [gameMode]);

  const syncState = (state) => {
    setBoard(state.board);
    setTurn(state.turn);
    setWhiteCost(state.whiteCost);
    setBlackCost(state.blackCost);
    setCapturedPieces(state.capturedPieces);
    setGameStatus(state.gameStatus);
    setWhiteAssignments(state.whiteAssignments);
    setBlackAssignments(state.blackAssignments);
  };

  // Play Sound Effects Helper
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      let path = '';
      if (type === 'move') path = '/sounds/tap.mp3';
      else if (type === 'capture') path = '/sounds/lock.mp3';
      else if (type === 'skill') path = '/sounds/skill.mp3';
      else if (type === 'victory') path = '/sounds/victory.mp3';
      else if (type === 'reset') path = '/sounds/reset.mp3';

      if (path) {
        const audio = new Audio(path);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    } catch (e) {
      // ignore audio errors
    }
  };

  // Initialize Game Locally
  const handleStartLocal = () => {
    setGameMode('local');
    const initialBoard = createInitialBoard(whiteAssignments, blackAssignments);
    setBoard(initialBoard);
    setTurn('white');
    setWhiteCost(2);
    setBlackCost(2);
    setCapturedPieces({ white: [], black: [] });
    setGameStatus('active');
    setSelectedCell(null);
    setValidMoves([]);
    setSkillActive(false);
    setValidSkillTargets([]);
    playSound('reset');
  };

  // Online actions
  const handleCreateRoom = () => {
    if (!socketConnected) {
      alert('เซิร์ฟเวอร์ยังไม่พร้อมเชื่อมต่อค่ะ');
      return;
    }
    socketRef.current.emit('create-room', { whiteAssignments, blackAssignments });
  };

  const handleJoinRoom = () => {
    if (!socketConnected) {
      alert('เซิร์ฟเวอร์ยังไม่พร้อมเชื่อมต่อค่ะ');
      return;
    }
    if (!roomIdInput.trim()) {
      alert('กรุณากรอกรหัสห้องเล่นเกมค่ะ');
      return;
    }
    socketRef.current.emit('join-room', { roomId: roomIdInput.trim().toUpperCase() });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Initial board helper
  const createInitialBoard = (whiteAssign, blackAssign) => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));

    const getPieceData = (side, role) => {
      const config = side === 'white' ? whiteAssign : blackAssign;
      const item = config[role];
      return {
        id: `${side}-${role}-${Math.random().toString(36).substring(2, 5)}`,
        role,
        side,
        studentId: item?.id || '',
        studentName: item?.name || role,
        image: item?.image || '',
        shielded: false,
        frozen: false,
        hasMoved: false
      };
    };

    const backRowOrder = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK'];

    for (let c = 0; c < 8; c++) {
      newBoard[0][c] = getPieceData('black', backRowOrder[c]);
      newBoard[1][c] = getPieceData('black', 'PAWN');
      newBoard[6][c] = getPieceData('white', 'PAWN');
      newBoard[7][c] = getPieceData('white', backRowOrder[c]);
    }

    return newBoard;
  };

  // Move validation engine (standard chess moves)
  const getMoves = (r, c, customBoard = board) => {
    const piece = customBoard[r][c];
    if (!piece) return [];
    const moves = [];
    const side = piece.side;

    const addMove = (nr, nc) => {
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
      const dest = customBoard[nr][nc];
      if (!dest) {
        moves.push({ r: nr, c: nc });
        return true; // empty, can continue for sliding pieces
      }
      if (dest.side !== side) {
        moves.push({ r: nr, c: nc }); // capture
      }
      return false; // hit obstacle, stop sliding
    };

    switch (piece.role) {
      case 'PAWN': {
        const dir = side === 'white' ? -1 : 1;
        const startRow = side === 'white' ? 6 : 1;

        // 1 step forward
        const f1R = r + dir;
        if (f1R >= 0 && f1R < 8 && !customBoard[f1R][c]) {
          moves.push({ r: f1R, c: c });
          // 2 steps forward
          const f2R = r + dir * 2;
          if (r === startRow && !customBoard[f2R][c]) {
            moves.push({ r: f2R, c: c });
          }
        }

        // Diagonal capture
        for (const dc of [-1, 1]) {
          const tc = c + dc;
          const tr = r + dir;
          if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
            const dest = customBoard[tr][tc];
            if (dest && dest.side !== side) {
              moves.push({ r: tr, c: tc });
            }
          }
        }
        break;
      }
      case 'KNIGHT': {
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
        break;
      }
      case 'BISHOP': {
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        dirs.forEach(([dr, dc]) => {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const keepGoing = addMove(nr, nc);
            if (!keepGoing) break;
            nr += dr;
            nc += dc;
          }
        });
        break;
      }
      case 'ROOK': {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        dirs.forEach(([dr, dc]) => {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const keepGoing = addMove(nr, nc);
            if (!keepGoing) break;
            nr += dr;
            nc += dc;
          }
        });
        break;
      }
      case 'QUEEN': {
        const dirs = [
          [-1, -1], [-1, 1], [1, -1], [1, 1],
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        dirs.forEach(([dr, dc]) => {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const keepGoing = addMove(nr, nc);
            if (!keepGoing) break;
            nr += dr;
            nc += dc;
          }
        });
        break;
      }
      case 'KING': {
        const dirs = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        dirs.forEach(([dr, dc]) => addMove(r + dr, c + dc));
        break;
      }
    }

    return moves;
  };

  // Skill Target validation based on studentId
  const getSkillTargets = (r, c) => {
    const piece = board[r][c];
    if (!piece) return [];
    const targets = [];
    const side = piece.side;
    const studentId = piece.studentId;

    switch (studentId) {
      // KING: Sensei (Arona / Plana)
      case 'arona':
      case 'plana': {
        // Adult's Card: Any empty adjacent square
        const dirs = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        dirs.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!board[nr][nc]) {
              targets.push({ r: nr, c: nc });
            }
          }
        });
        break;
      }

      // QUEEN: Mika
      case '10059': {
        // Kyrie Eleison: Snipe single enemy anywhere in 8 directions up to 4 range (ignores obstacles)
        const dirs = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        dirs.forEach(([dr, dc]) => {
          for (let step = 1; step <= 4; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              const targetPiece = board[nr][nc];
              if (targetPiece && targetPiece.side !== side) {
                targets.push({ r: nr, c: nc });
              }
            }
          }
        });
        break;
      }

      // QUEEN: Hina
      case '10004': {
        // End of Babel: Fan shape 2-rows deep in front (4 squares total)
        const dir = side === 'white' ? -1 : 1;
        const row1 = [{ r: r + dir, c: c }];
        const row2 = [
          { r: r + dir * 2, c: c - 1 },
          { r: r + dir * 2, c: c },
          { r: r + dir * 2, c: c + 1 }
        ];
        const allSquares = [...row1, ...row2];
        allSquares.forEach(({ r: nr, c: nc }) => {
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            targets.push({ r: nr, c: nc });
          }
        });
        break;
      }

      // ROOK: Yuuka
      case '13010': {
        // Calculation Shield: self target
        targets.push({ r, c });
        break;
      }

      // ROOK: Hoshino
      case '10005': {
        // Tactical Shield / Stun: self target (adds stun to adjacent enemies on activate)
        targets.push({ r, c });
        break;
      }

      // BISHOP: Iori
      case '10006': {
        // Swift Shot: diagonals within 3 steps containing enemies
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        dirs.forEach(([dr, dc]) => {
          for (let step = 1; step <= 3; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              const targetPiece = board[nr][nc];
              if (targetPiece && targetPiece.side !== side) {
                targets.push({ r: nr, c: nc });
              }
            }
          }
        });
        break;
      }

      // BISHOP: Serina
      case '26003': {
        // Trinitarian Healing: any ally on board
        for (let nr = 0; nr < 8; nr++) {
          for (let nc = 0; nc < 8; nc++) {
            const targetPiece = board[nr][nc];
            if (targetPiece && targetPiece.side === side) {
              targets.push({ r: nr, c: nc });
            }
          }
        }
        break;
      }

      // KNIGHT: Shiroko
      case '10010': {
        // Drone Support: Knight L-shape squares with enemies
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const targetPiece = board[nr][nc];
            if (targetPiece && targetPiece.side !== side) {
              targets.push({ r: nr, c: nc });
            }
          }
        });
        break;
      }

      // KNIGHT: Tsurugi
      case '10013': {
        // Cleansing Bloodlust: Knight L-shape squares with enemies
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const targetPiece = board[nr][nc];
            if (targetPiece && targetPiece.side !== side) {
              targets.push({ r: nr, c: nc });
            }
          }
        });
        break;
      }
    }

    return targets;
  };

  // Handler for Cell Selection (Allows inspecting opponent pieces)
  const handleCellClick = (r, c) => {
    if (gameStatus !== 'active') return;

    // Check if clicking a destination
    const isMoveDest = validMoves.some(m => m.r === r && m.c === c);
    const isSkillDest = validSkillTargets.some(m => m.r === r && m.c === c);

    if (isMoveDest && selectedCell) {
      // Must be our turn to move
      if (gameMode === 'online' && turn !== mySide) return;
      executeMove(selectedCell, { r, c });
      return;
    }

    if (isSkillDest && selectedCell) {
      // Must be our turn to cast
      if (gameMode === 'online' && turn !== mySide) return;
      executeSkill(selectedCell, { r, c });
      return;
    }

    // Normal selection
    const piece = board[r][c];
    if (piece) {
      setSelectedCell({ r, c });
      setSkillActive(false);
      setValidSkillTargets([]);
      setRevivalSelectActive(false);

      // If it's our piece AND it is our turn, show move highlights
      const isOnlineMyTurn = gameMode === 'online' && turn === mySide;
      const isLocalMyTurn = gameMode === 'local';
      
      if (piece.side === turn && (isOnlineMyTurn || isLocalMyTurn)) {
        if (piece.frozen) {
          // Keep selected to inspect, but show no moves
          setValidMoves([]);
        } else {
          setValidMoves(getMoves(r, c));
        }
      } else {
        // Inspecting enemy or clicked during opponent turn: show no moves
        setValidMoves([]);
      }
    } else {
      // Clear selection on empty click
      setSelectedCell(null);
      setValidMoves([]);
      setSkillActive(false);
      setValidSkillTargets([]);
      setRevivalSelectActive(false);
    }
  };

  // Switch to EX Skill mode for the selected piece
  const handleToggleSkill = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    const piece = board[r][c];
    if (!piece) return;

    // Check Cost
    const currentCost = turn === 'white' ? whiteCost : blackCost;
    const skill = STUDENT_SKILLS[piece.studentId];
    if (!skill) return;

    if (currentCost < skill.cost) {
      alert(`แต้ม Cost ไม่เพียงพอ (ต้องการ ${skill.cost} Cost)`);
      return;
    }

    if (piece.role === 'KING') {
      const deadPawns = capturedPieces[turn].filter(p => p.role === 'PAWN');
      if (deadPawns.length === 0) {
        alert('ไม่มีเบี้ย (Pawn) ที่ตายแล้วให้ชุบชีวิตค่ะ');
        return;
      }
    }

    setSkillActive(true);
    setValidMoves([]);
    setValidSkillTargets(getSkillTargets(r, c));
  };

  // Execute standard move
  const executeMove = (from, to) => {
    if (gameMode === 'online') {
      socketRef.current.emit('move-piece', { roomId, from, to });
      setSelectedCell(null);
      setValidMoves([]);
      return;
    }

    // --- LOCAL MODE GAMEPLAY LOGIC ---
    const updatedBoard = board.map(row => [...row]);
    const piece = updatedBoard[from.r][from.c];
    const destPiece = updatedBoard[to.r][to.c];

    if (destPiece) {
      if (destPiece.shielded) {
        alert('หมากเป้าหมายกางบาเรียป้องกันอยู่ค่ะ!');
        return;
      }
      playSound('capture');
      // Add to captured pieces
      const capSide = destPiece.side;
      capturedPieces[capSide].push(destPiece);
      setCapturedPieces({ ...capturedPieces });

      // Win Condition: King captured
      if (destPiece.role === 'KING') {
        setGameStatus(turn === 'white' ? 'white_win' : 'black_win');
        playSound('victory');
      }
    } else {
      playSound('move');
    }

    // Move piece
    piece.hasMoved = true;
    updatedBoard[to.r][to.c] = piece;
    updatedBoard[from.r][from.c] = null;

    // Pawn promotion to Queen
    if (piece.role === 'PAWN') {
      if ((piece.side === 'white' && to.r === 0) || (piece.side === 'black' && to.r === 7)) {
        piece.role = 'QUEEN';
        // Force Hina or Mika based on team
        const id = piece.side === 'white' ? "10059" : "10004";
        const skill = STUDENT_SKILLS[id];
        piece.studentName = skill.name;
        piece.studentId = id;
        piece.image = piece.side === 'white' ? "/images/student/icon/10059.webp" : "/images/student/icon/10004.webp";
        alert(`${piece.side === 'white' ? 'ฝั่งขาว' : 'ฝั่งดำ'} เบี้ยโปรโมทเป็น Queen ${piece.studentName} แล้วค่ะ!`);
      }
    }

    // Clear freeze status for current player at the end of turn
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = updatedBoard[r][c];
        if (p && p.side === turn) {
          p.frozen = false;
        }
      }
    }

    // Switch turn
    const nextTurn = turn === 'white' ? 'black' : 'white';
    setTurn(nextTurn);

    // Increment cost
    if (nextTurn === 'white') {
      setWhiteCost(prev => Math.min(10, prev + 1));
    } else {
      setBlackCost(prev => Math.min(10, prev + 1));
    }

    // Clear shields for the incoming player
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = updatedBoard[r][c];
        if (p && p.side === nextTurn) {
          p.shielded = false;
        }
      }
    }

    setBoard(updatedBoard);
    setSelectedCell(null);
    setValidMoves([]);
  };

  // Handle King-Stun protection validation
  const processCaptureOrStun = (boardArr, r, c, attackerSide) => {
    const target = boardArr[r][c];
    if (!target || target.side === attackerSide) return false;
    
    if (target.shielded) return false; // Protected by shield

    if (target.role === 'KING') {
      // King stun protection!
      target.frozen = true;
      alert(`สกิลโจมตีใส่เซนเซ! บัตรผู้ใหญ่ช่วยป้องกันตัวไว้ได้ ทำให้เซนเซติดสถานะแช่แข็ง ชะงักขยับไม่ได้ในเทิร์นถัดไปแทนการถูกกิน!`);
      return false;
    } else {
      // Normal capture
      capturedPieces[target.side].push(target);
      boardArr[r][c] = null;
      return true;
    }
  };

  // Execute EX Skill
  const executeSkill = (from, to, forceTargets = null) => {
    const piece = board[from.r][from.c];
    if (!piece) return;

    const studentId = piece.studentId;
    const skill = STUDENT_SKILLS[studentId];
    if (!skill) return;

    if (gameMode === 'online') {
      let payloadTargets = {};
      if (piece.role === 'KING') {
        payloadTargets = { 
          r: to.r, 
          c: to.c, 
          revivedPawnId: forceTargets ? forceTargets.revivedPawnId : selectedDeceasedPawn.id 
        };
      } else if (studentId === '10004') { // Hina
        payloadTargets = { squares: getSkillTargets(from.r, from.c) };
      } else if (studentId === '10005' || studentId === '13010') { // Hoshino / Yuuka (self)
        payloadTargets = {};
      } else { // Mika, Serina, Iori, Shiroko, Tsurugi
        payloadTargets = { targetR: to.r, targetC: to.c };
      }

      socketRef.current.emit('use-skill', { 
        roomId, 
        from, 
        skillType: studentId, 
        targets: payloadTargets 
      });

      setSelectedCell(null);
      setValidSkillTargets([]);
      setSkillActive(false);
      setSelectedDeceasedPawn(null);
      return;
    }

    // --- LOCAL MODE GAMEPLAY LOGIC ---
    const updatedBoard = board.map(row => [...row]);
    let skillCost = skill.cost;
    let success = false;

    switch (studentId) {
      // KING: Sensei (Arona / Plana)
      case 'arona':
      case 'plana': {
        const pawnToRevive = forceTargets ? forceTargets.pawn : selectedDeceasedPawn;
        if (pawnToRevive && !updatedBoard[to.r][to.c]) {
          const index = capturedPieces[turn].findIndex(p => p.id === pawnToRevive.id);
          if (index !== -1) {
            capturedPieces[turn].splice(index, 1);
            setCapturedPieces({ ...capturedPieces });

            pawnToRevive.shielded = false;
            pawnToRevive.frozen = false;
            pawnToRevive.hasMoved = true;
            updatedBoard[to.r][to.c] = pawnToRevive;
            success = true;
            playSound('skill');
          }
        }
        break;
      }

      // QUEEN: Mika (Kyrie Eleison - Single Snipe)
      case '10059': {
        const captured = processCaptureOrStun(updatedBoard, to.r, to.c, turn);
        setCapturedPieces({ ...capturedPieces });
        success = true;
        playSound(captured ? 'capture' : 'skill');
        break;
      }

      // QUEEN: Hina (End of Babel - Small Fan Wipe)
      case '10004': {
        const targetSquares = getSkillTargets(from.r, from.c);
        let capturedAny = false;
        targetSquares.forEach(({ r, c }) => {
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const captured = processCaptureOrStun(updatedBoard, r, c, turn);
            if (captured) capturedAny = true;
          }
        });
        setCapturedPieces({ ...capturedPieces });
        success = true;
        playSound(capturedAny ? 'capture' : 'skill');
        break;
      }

      // ROOK: Yuuka (Calculation Shield - self shield)
      case '13010': {
        piece.shielded = true;
        success = true;
        playSound('skill');
        break;
      }

      // ROOK: Hoshino (Shield & Stun Adjacent)
      case '10005': {
        // Shield self
        piece.shielded = true;
        
        // Stun adjacent enemies (4 directions)
        const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
        dirs.forEach(([dr, dc]) => {
          const nr = from.r + dr;
          const nc = from.c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = updatedBoard[nr][nc];
            if (target && target.side !== turn) {
              target.frozen = true;
            }
          }
        });
        success = true;
        playSound('skill');
        break;
      }

      // BISHOP: Iori (Swift Shot - Diagonal Snipe)
      case '10006': {
        const captured = processCaptureOrStun(updatedBoard, to.r, to.c, turn);
        setCapturedPieces({ ...capturedPieces });
        success = true;
        playSound(captured ? 'capture' : 'skill');
        break;
      }

      // BISHOP: Serina (Healing Shield)
      case '26003': {
        const target = updatedBoard[to.r][to.c];
        if (target && target.side === turn) {
          target.shielded = true;
          success = true;
          playSound('skill');
        }
        break;
      }

      // KNIGHT: Shiroko (Drone Support - L-jump capture + refund 1)
      case '10010': {
        const captured = processCaptureOrStun(updatedBoard, to.r, to.c, turn);
        setCapturedPieces({ ...capturedPieces });
        
        // Shiroko does NOT move (remote drone strike)
        skillCost = 2; // (3 cost - 1 refund)
        success = true;
        playSound(captured ? 'capture' : 'skill');
        break;
      }

      // KNIGHT: Tsurugi (Cleansing Bloodlust - L-jump capture + shield)
      case '10013': {
        const captured = processCaptureOrStun(updatedBoard, to.r, to.c, turn);
        setCapturedPieces({ ...capturedPieces });
        
        // Knight moves to target
        piece.hasMoved = true;
        updatedBoard[to.r][to.c] = piece;
        updatedBoard[from.r][from.c] = null;
        
        // Grant shield to self
        piece.shielded = true;
        success = true;
        playSound(captured ? 'capture' : 'move');
        break;
      }
    }

    if (success) {
      // Deduct Cost
      if (turn === 'white') {
        setWhiteCost(prev => Math.max(0, prev - skillCost));
      } else {
        setBlackCost(prev => Math.max(0, prev - skillCost));
      }

      // Clear freeze status for current player at the end of turn
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = updatedBoard[r][c];
          if (p && p.side === turn) {
            p.frozen = false;
          }
        }
      }

      // Switch turn
      const nextTurn = turn === 'white' ? 'black' : 'white';
      setTurn(nextTurn);

      // Increment cost
      if (nextTurn === 'white') {
        setWhiteCost(prev => Math.min(10, prev + 1));
      } else {
        setBlackCost(prev => Math.min(10, prev + 1));
      }

      // Clear shields for the incoming player
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = updatedBoard[r][c];
          if (p && p.side === nextTurn) {
            p.shielded = false;
          }
        }
      }

      setBoard(updatedBoard);
      setSelectedCell(null);
      setValidSkillTargets([]);
      setSkillActive(false);
      setSelectedDeceasedPawn(null);
    }
  };

  // Trigger King's revive pawn select step
  const handleKingReviveStep = (pawn) => {
    if (!selectedCell) return;
    setSelectedDeceasedPawn(pawn);
    setRevivalSelectActive(true);
    setValidSkillTargets(getSkillTargets(selectedCell.r, selectedCell.c));
  };

  // Reset Game Local / Request server reset
  const handleResetGame = () => {
    if (gameMode === 'online') {
      socketRef.current.emit('reset-game', { roomId, whiteAssignments, blackAssignments });
      playSound('reset');
      return;
    }
    handleStartLocal();
  };

  const handleLeaveGame = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setGameMode(null);
    setOnlinePhase('lobby');
    setRoomId('');
    setSelectedCell(null);
    setValidMoves([]);
    setSkillActive(false);
    setValidSkillTargets([]);
    setGameStatus('active');
    setFocusMode(false);
  };

  // Customizer: Open student selection drawer
  const openCustomizer = (team, role) => {
    setSelectingRole({ team, role });
    setStudentSearchQuery('');
    setFocusedStudent(null);
  };

  // Customizer: select student and replace
  const handleSelectStudent = (student) => {
    if (!selectingRole) return;
    const { team, role } = selectingRole;

    if (team === 'white') {
      setWhiteAssignments(prev => ({
        ...prev,
        [role]: { id: student.id, name: student.name, image: student.image }
      }));
    } else {
      setBlackAssignments(prev => ({
        ...prev,
        [role]: { id: student.id, name: student.name, image: student.image }
      }));
    }
    setSelectingRole(null);
  };

  // Filter selectable students for uniqueness
  const getSelectableStudents = () => {
    if (!selectingRole) return [];
    const { team, role } = selectingRole;
    
    // Get currently assigned IDs (except the slot we are editing)
    const currentAssignments = team === 'white' ? whiteAssignments : blackAssignments;
    const assignedIds = Object.entries(currentAssignments)
      .filter(([r]) => r !== role)
      .map(([, student]) => String(student.id));

    // Get assignable pool for this role, then filter out already assigned students
    const pool = ASSIGNABLE_STUDENTS_POOL[role] || [];
    return pool.filter(student => !assignedIds.includes(String(student.id)));
  };

  const selectableStudents = getSelectableStudents();

  // Selected piece info helper
  const getSelectedPieceInfo = () => {
    if (!selectedCell) return null;
    const piece = board[selectedCell.r]?.[selectedCell.c];
    if (!piece) return null;

    const config = STUDENT_SKILLS[piece.studentId];
    return {
      piece,
      config
    };
  };

  const selectedInfo = getSelectedPieceInfo();

  return (
    <div className={`chess-game-container ${focusMode ? 'focus-mode-active' : ''}`}>
      {/* Background Banner Header */}
      <div className="chess-panel chess-header">
        <div className="chess-title-area">
          <h2>
            <Swords className="text-cyan-400 w-7 h-7" />
            Blue Archive Chess
          </h2>
          <p>สงครามกระดานกลยุทธ์แห่งคิโวทอส (2D Student Tactical Chess)</p>
        </div>
        <button className="chess-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          กลับไปล็อบบี้
        </button>
      </div>

      {/* 1. LOBBY SELECT MODE SCREEN */}
      {gameMode === null && (
        <div className="chess-panel">
          <h3 className="customizer-title mb-6">เลือกโหมดการเล่น</h3>
          <div className="chess-lobby-grid">
            <div className="lobby-option-card" onClick={handleStartLocal}>
              <div className="lobby-option-icon">
                <Users size={32} />
              </div>
              <h3>Local Hotseat</h3>
              <p>เล่นบนหน้าจอเดียวกันสลับฝั่งเดิน เหมาะสำหรับเล่นกับเพื่อนแบบออนไซต์ สะสมเกจสกิล EX และวางแผนหมากสไตล์เกมกระดานดั้งเดิม</p>
              <button className="lobby-option-btn">เล่นโหมด Local</button>
            </div>

            <div className="lobby-option-card" onClick={() => setGameMode('online')}>
              <div className="lobby-option-icon">
                <RefreshCw size={32} />
              </div>
              <h3>Online Multiplayer</h3>
              <p>เปิดศึกกับครูท่านอื่นแบบเรียลไทม์ ใช้ห้องแชร์รหัสในการเชื่อมต่อผ่าน WebSockets (Socket.io) มีเซิร์ฟเวอร์ควบคุมผลแพ้ชนะ</p>
              <button className="lobby-option-btn">เล่นโหมด Online</button>
            </div>
          </div>

          {/* Character Assignment Customizer below Lobby Selection */}
          <div className="customizer-section mt-8">
            <h3 className="customizer-title">ปรับเปลี่ยนจัดทีมนักเรียน (Team Customizer)</h3>
            <div className="team-customizer-grid">
              
              {/* WHITE TEAM CUSTOMIZER */}
              <div className="team-card white-team">
                <div className="team-card-header white-team-text">
                  <Sparkles size={18} />
                  ทีมสีขาว (SCHALE Defense Force)
                </div>
                <div className="piece-assign-list">
                  {Object.keys(whiteAssignments).map(role => {
                    const isCustomizable = role !== 'PAWN';
                    const studentId = whiteAssignments[role].id;
                    const skill = STUDENT_SKILLS[studentId];
                    return (
                      <div className="piece-assign-row" key={role}>
                        <span className="assign-role-label">{role}</span>
                        <div className="assign-student-display">
                          <img src={whiteAssignments[role].image} alt="" className="assign-student-img" />
                          <div className="flex flex-col">
                            <span className="assign-student-name">{whiteAssignments[role].name}</span>
                            {skill && (
                              <span className="text-xs text-orange-400">
                                EX: {skill.displayName} (Cost {skill.cost})
                              </span>
                            )}
                          </div>
                        </div>
                        {isCustomizable ? (
                          <button 
                            className="assign-change-btn"
                            onClick={() => openCustomizer('white', role)}
                          >
                            เปลี่ยนตัว
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic pr-2">ล็อกค่าเริ่มต้น</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BLACK TEAM CUSTOMIZER */}
              <div className="team-card black-team">
                <div className="team-card-header black-team-text">
                  <Swords size={18} />
                  ทีมสีดำ (Kaiser / Rival Mobs)
                </div>
                <div className="piece-assign-list">
                  {Object.keys(blackAssignments).map(role => {
                    const isCustomizable = role !== 'PAWN';
                    const studentId = blackAssignments[role].id;
                    const skill = STUDENT_SKILLS[studentId];
                    return (
                      <div className="piece-assign-row" key={role}>
                        <span className="assign-role-label">{role}</span>
                        <div className="assign-student-display">
                          <img src={blackAssignments[role].image} alt="" className="assign-student-img" />
                          <div className="flex flex-col">
                            <span className="assign-student-name">{blackAssignments[role].name}</span>
                            {skill && (
                              <span className="text-xs text-orange-400">
                                EX: {skill.displayName} (Cost {skill.cost})
                              </span>
                            )}
                          </div>
                        </div>
                        {isCustomizable ? (
                          <button 
                            className="assign-change-btn"
                            onClick={() => openCustomizer('black', role)}
                          >
                            เปลี่ยนตัว
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic pr-2">ล็อกค่าเริ่มต้น</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ONLINE MULTIPLAYER LOBBY SCREEN */}
      {gameMode === 'online' && onlinePhase === 'lobby' && (
        <div className="chess-panel online-setup-container">
          <div className="online-setup-header">
            <RefreshCw className="online-setup-spinner" size={28} />
            <h3 className="online-setup-title">Online Connection Center</h3>
          </div>

          {socketError && (
            <div className="socket-error-banner">
              <Info size={18} />
              {socketError}
            </div>
          )}

          <div className="online-setup-divider-line">
            <h4 className="online-setup-subtitle">เชื่อมต่อผ่านรหัสห้อง (Room Code)</h4>
            <p className="online-setup-desc">สร้างห้องใหม่เพื่อส่งรหัสให้เพื่อน หรือกรอกรหัสของห้องเพื่อนเพื่อร่วมแข่งขัน</p>
          </div>

          <div className="online-setup-form">
            <button 
              className="setup-primary-btn online-setup-create-btn" 
              onClick={handleCreateRoom}
              disabled={!socketConnected}
            >
              สร้างห้องแข่งขันใหม่ (Create Room)
            </button>

            <div className="online-setup-or-text">หรือ</div>

            <div className="online-setup-actions">
              <input 
                type="text" 
                className="online-setup-input" 
                placeholder="กรอกรหัสห้อง 6 หลัก"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                maxLength={6}
              />
              <button 
                className="setup-primary-btn" 
                onClick={handleJoinRoom}
                disabled={!socketConnected}
              >
                ร่วมแข่งขัน (Join)
              </button>
            </div>
          </div>

          <button className="chess-reset-btn mt-6" onClick={handleLeaveGame}>
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </button>
        </div>
      )}

      {/* 3. ACTIVE ARENA SCREEN (LOCAL OR ONLINE GAMEPLAY) */}
      {((gameMode === 'local') || (gameMode === 'online' && onlinePhase === 'arena')) && (
        <div className="chess-arena">
          
          {/* CHESSBOARD AREA */}
          <div className="chess-left-col">
            <div className={`chess-board-outer ${turn === 'white' ? 'white-turn-glow' : 'black-turn-glow'}`}>
              <div className="chess-board">
                {board.map((row, r) => 
                  row.map((piece, c) => {
                    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                    const isMoveDest = validMoves.some(m => m.r === r && m.c === c);
                    const isSkillDest = validSkillTargets.some(m => m.r === r && m.c === c);
                    const tileClass = (r + c) % 2 === 0 ? 'tile-light' : 'tile-dark';

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`chess-cell ${tileClass} ${isSelected ? 'is-selected' : ''} ${isMoveDest ? 'is-move-dest' : ''} ${isSkillDest ? 'is-skill-dest' : ''} ${piece ? 'has-piece' : ''}`}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {piece && (
                          <div className={`chess-piece-container ${piece.side === 'white' ? 'white-side' : 'black-side'} ${piece.shielded ? 'is-shielded' : ''} ${piece.frozen ? 'is-frozen' : ''}`}>
                            
                            {/* Shield indicator badge */}
                            {piece.shielded && (
                              <div className="piece-status-badge shield-badge">
                                <Shield size={10} />
                              </div>
                            )}

                            {/* Freeze indicator badge */}
                            {piece.frozen && (
                              <div className="piece-status-badge freeze-badge">
                                <Snowflake size={10} />
                              </div>
                            )}

                            <img 
                              src={piece.image} 
                              alt={piece.studentName} 
                              className="chess-piece-avatar" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/schoolicon/ETC.png';
                              }}
                            />
                            
                            {/* Role abbreviation badge */}
                            <div className="piece-role-badge">
                              {piece.role === 'KNIGHT' ? 'N' : piece.role.charAt(0)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* CHESS SIDEBAR / HUD CONTROL PANEL */}
          <div className="chess-right-col chess-sidebar-panel">
            
            {/* Online Room Info (If Online Mode) */}
            {gameMode === 'online' && (
              <div className="sidebar-section online-room-badge flex flex-col gap-3">
                <div className="flex justify-between items-center w-full">
                  <span className="text-slate-400 font-bold">รหัสห้อง:</span>
                  <div className="flex flex-col items-end">
                    <span className="room-id-tag" onClick={copyRoomId}>
                      {roomId} {copied ? <Check size={12} className="inline ml-1" /> : <Copy size={12} className="inline ml-1" />}
                    </span>
                    <span className="copy-hint">คลิกเพื่อคัดลอกรหัส</span>
                  </div>
                </div>
                
                <div className="online-players-status border-t border-slate-700 pt-3">
                  <div className="status-indicator">
                    <span className="status-indicator-dot online"></span>
                    <span>คุณ: ฝั่ง{mySide === 'white' ? 'ขาว (SCHALE)' : 'ดำ (Kaiser)'}</span>
                  </div>
                  <div className="status-indicator">
                    <span className={`status-indicator-dot ${opponentConnected ? 'online' : 'offline'}`}></span>
                    <span>คู่แข่ง: {opponentConnected ? 'เชื่อมต่อแล้ว' : 'กำลังรอคู่แข่งเชื่อมต่อ...'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Match Status Card */}
            <div className="sidebar-section match-status-card">
              <div className="turn-display">
                <span className={`turn-dot ${turn === 'white' ? 'white-dot' : 'black-dot'}`}></span>
                <span>เทิร์น: {turn === 'white' ? 'ฝ่ายขาว (ครู SCHALE)' : 'ฝ่ายดำ (ครู Kaiser)'}</span>
              </div>

              {/* White Team Cost Meter */}
              <div className="cost-meter-box">
                <div className="cost-meter-title">
                  <span>White Energy Cost:</span>
                  <span className="cost-value-text">{whiteCost}/10</span>
                </div>
                <div className="cost-bar-grid">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={`white-cost-${i}`} 
                      className={`cost-bar-segment ${i < whiteCost ? 'filled-white' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Black Team Cost Meter */}
              <div className="cost-meter-box">
                <div className="cost-meter-title">
                  <span>Black Energy Cost:</span>
                  <span className="cost-value-text black-text">{blackCost}/10</span>
                </div>
                <div className="cost-bar-grid">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={`black-cost-${i}`} 
                      className={`cost-bar-segment ${i < blackCost ? 'filled-black' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Piece Info & EX Skill Cast Panel */}
            {selectedInfo ? (
              <div className="sidebar-section selected-piece-card">
                <div className="selected-piece-header">
                  <img src={selectedInfo.piece.image} alt="" className="selected-piece-img" />
                  <div className="selected-piece-title">
                    <span className="selected-piece-name">
                      {selectedInfo.piece.studentName} 
                      {selectedInfo.piece.side !== turn && " (หมากคู่แข่ง)"}
                    </span>
                    <span className="selected-piece-role">{selectedInfo.piece.role}</span>
                  </div>
                </div>

                {/* EX SKILL INFO */}
                {selectedInfo.config ? (
                  <div className="ex-skill-action-box mt-3">
                    <div className="ex-skill-name-row">
                      <span className="ex-skill-badge">EX SKILL</span>
                      <span className="ex-skill-cost-badge">COST {selectedInfo.config.cost}</span>
                    </div>
                    <h4 className="text-orange-400 font-bold text-sm">{selectedInfo.config.displayName}</h4>
                    <p className="ex-skill-desc mt-1">{selectedInfo.config.description}</p>
                    
                    {/* King Revive Pawn Selection Step (Only for turn-owner) */}
                    {selectedInfo.piece.role === 'KING' && selectedInfo.piece.side === turn && !revivalSelectActive && (
                      <div className="flex flex-col gap-2 mt-2 border-t border-slate-700/50 pt-2">
                        <span className="text-xs text-slate-400 font-bold">เลือก Pawn ที่จะอัญเชิญใหม่:</span>
                        <div className="captured-list-icons">
                          {capturedPieces[turn].filter(p => p.role === 'PAWN').map(pawn => (
                            <img 
                              key={pawn.id}
                              src={pawn.image} 
                              alt="" 
                              className={`captured-item-icon revivable ${selectedDeceasedPawn?.id === pawn.id ? 'selected-for-revival' : ''}`}
                              onClick={() => handleKingReviveStep(pawn)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activation Button (Only for own pieces on own turn) */}
                    {selectedInfo.piece.side === turn && (gameMode !== 'online' || turn === mySide) && (
                      <>
                        {(!skillActive && (selectedInfo.piece.role !== 'KING' || selectedDeceasedPawn)) && (
                          <button 
                            className="use-skill-btn mt-3 w-full" 
                            onClick={handleToggleSkill}
                            disabled={(turn === 'white' ? whiteCost : blackCost) < selectedInfo.config.cost}
                          >
                            เปิดระบบเล็งสกิล EX Skill
                          </button>
                        )}

                        {skillActive && (
                          <div className="text-center text-xs text-orange-400 font-bold border border-orange-500/20 bg-orange-500/5 p-2 rounded-lg mt-3">
                            {selectedInfo.piece.role === 'ROOK' || selectedInfo.piece.studentId === '10005' ? 
                              "คลิกที่ตัวหมากอีกครั้ง เพื่อกางบาเรียปกป้องตัวเอง!" : 
                              "คลิกเลือกเป้าหมาย (ช่องสีส้ม) บนกระดานเพื่อปล่อยพลังสกิล!"
                            }
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-3 bg-black/10 p-2 rounded text-center">
                    (หมากชิ้นนี้ไม่มีทักษะพิเศษ EX Skill เฉพาะตัว)
                  </p>
                )}
              </div>
            ) : (
              <div className="sidebar-section empty-selection-text text-center py-8 text-slate-500 font-bold">
                คลิกเลือกหมากนักเรียนบนกระดานเพื่อเริ่มสั่งการเดินหรือดูสกิลตัวละคร
              </div>
            )}

            {/* Captured Pieces Panel */}
            <div className="sidebar-section captured-panel-card">
              <span className="captured-panel-title">นักเรียนที่ล่าถอยออกสนามรบ</span>
              
              <div className="captured-team-row border-b border-slate-700/50 pb-2">
                <span className="captured-team-sub white-team-text">ฝ่ายขาว (SCHALE) ที่ล่าถอย:</span>
                <div className="captured-list-icons">
                  {capturedPieces.white.map(p => (
                    <img key={p.id} src={p.image} alt="" className="captured-item-icon" />
                  ))}
                </div>
              </div>

              <div className="captured-team-row">
                <span className="captured-team-sub black-team-text">ฝ่ายดำ (Kaiser) ที่ล่าถอย:</span>
                <div className="captured-list-icons">
                  {capturedPieces.black.map(p => (
                    <img key={p.id} src={p.image} alt="" className="captured-item-icon" />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Controls Section */}
            <div className="sidebar-section sidebar-controls">
              <button className="chess-reset-btn" onClick={handleLeaveGame}>
                <ArrowLeft size={16} /> ออกจากการแข่งขัน
              </button>
              <button className="chess-reset-btn" onClick={() => setFocusMode(!focusMode)}>
                {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                {focusMode ? 'แสดง UI ทั้งหมด' : 'โหมดโฟกัส (ซ่อน UI)'}
              </button>
              <button className="chess-reset-btn" onClick={handleResetGame}>
                <RefreshCw size={16} /> รีเซ็ตกระดาน
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. STUDENT CUSTOMIZATION SELECTOR DRAWER */}
      {selectingRole && (() => {
        const filteredStudents = selectableStudents.filter(student =>
          student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
          student.school.toLowerCase().includes(studentSearchQuery.toLowerCase())
        );

        const activeStudent = focusedStudent || filteredStudents[0] || null;
        const activeSkill = activeStudent ? STUDENT_SKILLS[activeStudent.id] : null;

        return (
          <div className="student-selector-modal">
            <div className="student-selector-box">
              <div className="student-selector-header">
                <h4>
                  เลือกนักเรียนสำหรับตำแหน่ง {selectingRole.role} 
                  ({selectingRole.team === 'white' ? 'ทีมขาว' : 'ทีมดำ'})
                </h4>
                <button 
                  className="student-selector-close"
                  onClick={() => setSelectingRole(null)}
                >
                  ปิด
                </button>
              </div>
              
              <div className="student-selector-body">
                {/* Left Column: Search & Compact Roster */}
                <div className="student-selector-left">
                  <div className="student-search-container">
                    <Search className="search-icon" size={16} />
                    <input 
                      type="text" 
                      placeholder="ค้นหานักเรียน..." 
                      className="student-search-input"
                      value={studentSearchQuery}
                      onChange={(e) => {
                        setStudentSearchQuery(e.target.value);
                        setFocusedStudent(null);
                      }}
                    />
                  </div>

                  <div className="student-list-scroll">
                    <div className="special-selector-divider">รายชื่อนักเรียน ({filteredStudents.length})</div>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => {
                        const isActive = activeStudent && activeStudent.id === student.id;
                        return (
                          <div 
                            key={student.id} 
                            className={`student-select-item ${isActive ? 'is-active' : ''}`}
                            onClick={() => setFocusedStudent(student)}
                          >
                            <img src={student.image} alt="" />
                            <div className="student-select-info">
                              <span className="student-select-name">{student.name}</span>
                              <span className="student-select-school">{student.school}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-slate-500 font-bold py-6 text-sm">
                        ไม่พบข้อมูลนักเรียนที่ค้นหาค่ะ
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Skill Details & Confirmation */}
                <div className="student-selector-right">
                  {activeStudent ? (
                    <div className="student-detail-pane animate-fade-in">
                      <div className="student-detail-header">
                        <img src={activeStudent.image} alt="" className="student-detail-avatar" />
                        <div className="student-detail-meta">
                          <span className="student-detail-name">{activeStudent.name}</span>
                          <span className="student-detail-school">{activeStudent.school} School</span>
                        </div>
                      </div>

                      {activeSkill ? (
                        <div className="student-detail-skill-box">
                          <div className="student-detail-skill-title">
                            <span className="skill-badge-text">EX Skill</span>
                            <span className="skill-cost-badge">COST {activeSkill.cost}</span>
                          </div>
                          <h5 className="student-detail-skill-name">{activeSkill.displayName}</h5>
                          <p className="student-detail-skill-desc">{activeSkill.description}</p>
                        </div>
                      ) : (
                        <div className="student-detail-skill-box empty-skill">
                          <p className="text-slate-500 text-xs italic">หมากชิ้นนี้ไม่มีทักษะพิเศษ EX Skill เฉพาะตัว</p>
                        </div>
                      )}

                      <button 
                        className="setup-primary-btn confirm-student-btn"
                        onClick={() => handleSelectStudent(activeStudent)}
                      >
                        จัดทีมคนนี้
                      </button>
                    </div>
                  ) : (
                    <div className="student-detail-pane empty-pane">
                      <Info size={32} className="text-slate-600 mb-2" />
                      <p className="text-slate-500 text-sm">ไม่มีนักเรียนเหลือให้เลือกในตำแหน่งนี้ค่ะ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. MATCH CONCLUDED WIN MODAL */}
      {gameStatus !== 'active' && (
        <div className="win-modal-overlay">
          <div className="win-modal-box">
            <span className="text-slate-400 font-bold text-sm tracking-wider uppercase">การต่อสู้สิ้นสุดลงแล้ว</span>
            
            <h3 className={`win-title ${gameStatus === 'black_win' ? 'black-winner' : ''}`}>
              {gameStatus === 'white_win' ? 'ชัยชนะของฝ่ายขาว (SCHALE)' : 'ชัยชนะของฝ่ายดำ (Kaiser)'}
            </h3>
            
            <p className="win-subtitle">
              เซนเซ (King) ของฝ่าย {gameStatus === 'white_win' ? 'ดำ' : 'ขาว'} ได้พ่ายแพ้และล่าถอยออกจากสนามรบเรียบร้อยแล้วค่ะ!
            </p>
            
            <div className="win-actions">
              <button className="start-game-btn" onClick={handleResetGame}>
                เริ่มกระดานใหม่
              </button>
              <button className="chess-reset-btn" onClick={handleLeaveGame}>
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
