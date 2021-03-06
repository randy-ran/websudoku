var SUDOKU = (function($) {
	"use strict";
			
	function unique(arr) {
		var result = [];
		$.each(arr, function (idx, elem) {
			if ($.inArray(elem, result) === -1) {
				result.push(elem);
			}
		});
		return result;
	}
	
	function calcCellIndexFromBoardPosition(row, col) {
		return (row - 1) * 9 + (col - 1);
	}
	
	function calcBoardPositionFromIndex(idx) {
		var row = Math.floor(idx / 9) + 1;
		var col = idx % 9 + 1;
		return {
			row: row,
			column: col
		};
	}

	/**
	 * Creates a sudoku board cell.
	 * 
	 * @class Represents a cell on a sudoku board.
	 * @constructor
	 * @param {number} col The cell column, in the interval [1, 9].
	 * @param {number} row The cell row, in the interval [1, 9].
	 * @param {number} val The value of the cell, in the interval [0, 9]. 0 means no value.
	 * @param {bool} fixed Whether the value has a fixed value, i.e. whether it is an initial
	 *                     non-zero value.
	 */
	function Cell(row, col, val, fixed) {
		/** The cell row. */
		this.row = row;
		/** The cell column. */
		this.column = col;
		/** The cell value. 0 means it has no value.*/
		this.value = val;
		/** Whether the value is fixed. */
		this.isFixed = fixed;
	}
	
	/**
	 * Copies the given cell.
	 * 
	 * @param {Cell} cell The cell to copy.
	 * @return {Cell} A copy of the cell.
	 * */
	Cell.fromCell = function(cell) {
		return new Cell(cell.row, cell.column, cell.value, cell.isFixed);
	};
	
	/**
	 * Creates a sudoku board.
	 * 
	 * @class Represents a sudoku board, with methods for manipulating it.
	 * @constructor
	 * @param {string} boardDef The initial board configuration; a string of 81 numbers.
	 */
	function Board(boardDef) {
		var cells = [];
		
		function init() {
			var i;
			var pos, num, fixed;
			
			if (typeof boardDef !== "string") {
				throw {
					name: "SudokuBoardError",
					message: "Invalid board definition (not a string)"
				};
			}
			if (boardDef.length !== 81) {
				throw {
					name: "SudokuBoardError",
					message: "Invalid board definition (wrong length)"
				};
			}
			
			for (i = 0; i < boardDef.length; i += 1) {
				pos = calcBoardPositionFromIndex(i);
				num = parseInt(boardDef[i], 10);
				fixed = num !== 0;
				
				if (isNaN(num) || num < 0 || num > 9) {
					throw {
						name: "SudokuBoardError",
						message: "Invalid board definition (invalid cell value)"
					};
				}
				
				cells[i] = new Cell(pos.row, pos.column, num, fixed);
			}
		}
		
		function getCellAtPosition(row, col, copy) {
			var idx = calcCellIndexFromBoardPosition(row, col);
			var cell = cells[idx];
			return copy ? Cell.fromCell(cell) : cell;
		}
		
		function walkCellsByRow(cb) {
			var row, col, newRow, cell;
			for (row = 1; row <= 9; row += 1) {
				for (col = 1; col <= 9; col += 1) {
					cell = getCellAtPosition(row, col, false);
					newRow = col === 1;
					if (cb(cell, row, newRow) === false) {
						return;
					}
				}
			}
		}
			
		function walkCellsByColumn(cb) {
			var row, col, newCol, cell;
			for (col = 1; col <= 9; col += 1) {
				for (row = 1; row <= 9; row += 1) {
					cell = getCellAtPosition(row, col, false);
					newCol = row === 1;
					if (cb(cell, col, newCol) === false) {
						return;
					}
				}
			}
		}
			
		function walkCellsByBox(cb) {
			var boxIdx, inBoxIdx, newBox, firstCellIdx, cellIndices;
			var cell;
			for (boxIdx = 0; boxIdx < 9; boxIdx += 1) {
				firstCellIdx = Math.floor(boxIdx / 3) * 27 + (boxIdx % 3 * 3);
				cellIndices = [firstCellIdx,      firstCellIdx + 1,  firstCellIdx + 2,
				               firstCellIdx + 9,  firstCellIdx + 10, firstCellIdx + 11,
				               firstCellIdx + 18, firstCellIdx + 19, firstCellIdx + 20];
				for (inBoxIdx = 0; inBoxIdx < 9; inBoxIdx += 1) {
					cell = cells[cellIndices[inBoxIdx]];
					newBox = inBoxIdx === 0;
					if (cb(cell, boxIdx + 1, newBox) === false) {
						return;
					}
				}
			}
		}
		
		/** 
		 * Returns the current board as an array of 81 cells.
		 * 
		 * @return {array of Cell} The current board.
		 */
		this.getBoard = function() {
			return $.extend(true, [], cells);
		};
		
		/**
		 * Returns the cell at the specified position.
		 * 
		 * @param {number} row The row of the cell.
		 * @param {number} col The column of the cell.
		 * @return {Cell} The cell.
		 */
		this.getCell = function(row, col) {
			return getCellAtPosition(row, col, true);
		};
		
		/**
		 * Sets the value for the specified cell. Only non-fixed cells can have their values changed.
		 * 
		 * @param {number} row The row of the cell.
		 * @param {number} col The column of the cell.
		 * @return {bool} True if the cell value could be changed, otherwise false.
		 */
		this.setCellValue = function(row, col, value) {
			var cell = getCellAtPosition(row, col, false);
			if (!cell.isFixed) {
				cell.value = value;
			}
			return !cell.isFixed;
		};

		/**
		 * Checks whether the board is solved.
		 * 
		 * @return {bool} True if the board is solved, otherwise false.
		 */
		this.hasWon = function() {
			var won = true;
			
			function check(walkFun) {
				var usedNumbers;
				walkFun(function(cell, x, newX) {
					if (newX) {
						usedNumbers = {};
					}
					if (!cell.value) {
						won = false;
					} else if (usedNumbers[cell.value]) {
						won = false;
					} else {
						usedNumbers[cell.value] = true;
					}
					
					if (!won) {
						// Early exit.
						return false;
					}
				});
			}
			
			check(walkCellsByRow);
			if (!won) {
				check(walkCellsByColumn);
			}
			if(!won) {
				check(walkCellsByBox);
			}
			
			return won;
		};
		
		/**
		 * Returns all cells that conflict with other cells.
		 * The cells are ordered by row primarily and column secondarily.
		 * 
		 * @return {array of Cell} Cells that are in a conflict.  
		 */
		this.getConflicts = function() {
			var conflicts = [];
			
			function check(walkFun) {
				var cellsWithValue;
				walkFun(function(cell, x, newX) {
					if (newX) {
						if (cellsWithValue) {
							$.each(cellsWithValue, function(value, cells) {
								if (cells && cells.length > 1) {
									conflicts = conflicts.concat(cells);
								}
							});
						}
						cellsWithValue = {};
					}
									
					if (cell.value) {
						if(cellsWithValue[cell.value] === undefined) {
							cellsWithValue[cell.value] = [cell];
						} else {
							cellsWithValue[cell.value].push(cell);
						}
					}
				});
				
				// Handle the last row/column/box.
				$.each(cellsWithValue, function(value, cells) {
					if (cells && cells.length > 1) {
						conflicts = conflicts.concat(cells);
					}
				});
			}
			
			check(walkCellsByRow);
			check(walkCellsByColumn);
			check(walkCellsByBox);
			
			conflicts = unique(conflicts);
			conflicts.sort(function(a, b) {
				if (a.row < b.row) {
					return -1;
				} else if(a.row > b.row) {
					return 1;
				} else if (a.column < b.column) {
					return -1;
				} else if(a.column > b.column) {
					return 1;
				} else {
					// This shouldn't happen.
					return 0;
				}
			});
			
			return conflicts;
		};
		
        /**
         * Puts the board back into its original state.
         */
        this.restart = function() {
            walkCellsByRow(function (cell, newRow, rowIdx) {
                if (!cell.isFixed) {
                    cell.value = 0;
                }
            });
        };
        
		init();
	}

    function SudokuRunner() {
        var board = null;
        var activeCell = null;
        var hasWon = false;
        var conflicts = [];
        
        var runner = null;
        
        function initBoard() {
            var boards = SUDOKU.sudokuBoards;
            var boardDef = boards[Math.floor(Math.random() * boards.length)];
            board = new Board(boardDef);
        }
        
        function isCellInConflict(cell) {
            var i, conflictCell;
            for (i = 0; i < conflicts.length; i += 1) {
                conflictCell = conflicts[i];
                if (conflictCell.row === cell.row && conflictCell.column === cell.column) {
                    return true;
                }
            }
            return false;
        }
        
        function getAdjacentCell(cell, direction) {
            var result = null;
            switch (direction) {
                case 0:
                    // Left
                    if (cell.column > 1) {
                        result = board.getCell(cell.row, cell.column - 1);
                    }
                    break;
                case 1:
                    // Up
                    if (cell.row > 1) {
                        result = board.getCell(cell.row - 1, cell.column);
                    }
                    break;
                case 2:
                    // Right
                    if (cell.column < 9) {
                        result = board.getCell(cell.row, cell.column + 1);
                    }
                    break;
                case 3:
                    // Down
                    if (cell.row < 9) {
                        result = board.getCell(cell.row + 1, cell.column);
                    }
                    break;
            }
            return result;
        }
        
        function handleNumberInput(number) {
            if (!activeCell) {
                return;
            }
            
            board.setCellValue(activeCell.row, activeCell.column, number);
            if (board.hasWon()) {
                activeCell = null;
                hasWon = true;
            } else {
                conflicts = board.getConflicts();
            }
        }
        
        function CanvasRunner(drawingCanvas, clientSettings) {
            var defaultSettings = {
                cellSize: 30,
                
                outerBorderWidth: 2,
                cellBorderWidth: 1,
                boxBorderWidth: 2,
                
                fontSize: "12px",
                fontFamily: "Sans-serif",
                activeCellColor: "#efefef",
                winCellColor: "lightgreen",
                cellTextColor: "#000000",
                conflictCellTextColor: "#cc0000",
            };
            
            var settings = $.extend({}, defaultSettings, clientSettings);
            
            var cellSize = settings.cellSize;
            
            var $canvas = $(drawingCanvas);
            var canvas = $canvas.get(0); // Make sure that it's not wrapped in a jQuery object.
            var context = canvas.getContext("2d");
                
            var outerBorderWidth = settings.outerBorderWidth;
            var cellBorderWidth = settings.cellBorderWidth;
            var boxBorderWidth = settings.boxBorderWidth;
            var borderWidthPerAxis = 2 * outerBorderWidth + 6 * cellBorderWidth + 2 * boxBorderWidth;
            var boardSideSize = 9 * cellSize + borderWidthPerAxis;
            
            var activeCellBackgroundColor = settings.activeCellColor;
            var cellTextColor = settings.cellTextColor;
            var cellTextColorConflict = settings.conflictCellTextColor;
            var cellFont = "normal " + settings.fontSize + " " + settings.fontFamily;
            var fixedCellFont = "bold " + settings.fontSize + " " + settings.fontFamily;
            var winCellColor = settings.winCellColor;
            
            var cellPixelPositions = {};
            
            function getCellPixelCoords(cell) {
                return cellPixelPositions[cell.row + "," + cell.column];
            }
            
            function setCellPixelCoords(cell, boardX, boardY) {
                cellPixelPositions[cell.row + "," + cell.column] = {
                    boardX: boardX,
                    boardY: boardY
                };
            }
            
            function calcCanvasCoordsFromPageCoords(pageX, pageY) {
                var boardX = pageX - $canvas.offset().left;
                var boardY = pageY - $canvas.offset().top;
                return {
                    boardX: boardX,
                    boardY: boardY
                };
            }
            
            function getCellAtBoardCoords(boardX, boardY) {
                var row, col;
                var rowStart, rowEnd, colStart, colEnd;
                var cell, cellPosition;
                
                for (row = 1; row <= 9; row += 1) {
                    for (col = 1; col <= 9; col += 1) {
                        cell = board.getCell(row, col);
                        cellPosition = getCellPixelCoords(cell);
                        
                        rowStart = cellPosition.boardY;
                        rowEnd = rowStart + cellSize;
                        colStart = cellPosition.boardX;
                        colEnd = colStart + cellSize;
                        
                        if (rowStart <= boardY && boardY <= rowEnd &&
                                colStart <= boardX && boardX <= colEnd) {
                            return cell;
                        }
                    }
                }
                
                return null;
            }
                    
            function drawOuterBorder() {
                var lineOffset = outerBorderWidth * 0.5;
                var lineLength = boardSideSize;
                
                context.beginPath();
                
                // Left vertical border.
                context.moveTo(lineOffset, 0);
                context.lineTo(lineOffset, lineLength);
                // Right vertical border.
                context.moveTo(boardSideSize - lineOffset, 0);
                context.lineTo(boardSideSize - lineOffset, lineLength);
                // Top horizontal border.
                context.moveTo(0, lineOffset);
                context.lineTo(lineLength, lineOffset);
                // Bottom horizontal border.
                context.moveTo(0, boardSideSize - lineOffset);
                context.lineTo(lineLength, boardSideSize - lineOffset);
                        
                context.lineWidth = outerBorderWidth;
                context.strokeStyle = "#000";
                context.stroke();
            }
            
            function drawCellBorders() {
                var lineOffset; // = cellBorderWidth * 0.5;
                var lineLength = (9 * cellSize) + (6 * cellBorderWidth) + (2 * boxBorderWidth);
                var lineWidth;
                var row, col;
                var verticalOffset, horizontalOffset;
                var cell;
                
                verticalOffset = outerBorderWidth;
                
                for(row = 1; row <= 9; row += 1) {
                    // (Re)start from the left.
                    horizontalOffset = outerBorderWidth;
                    
                    for (col = 1; col <= 9; col += 1) {
                        // Store cell position.
                        cell = board.getCell(row, col);
                        setCellPixelCoords(cell, horizontalOffset, verticalOffset);
                        
                        if (col < 9) {
                            // Vertical line.
                            context.beginPath();
                            
                            lineWidth = (col % 3 === 0) ? boxBorderWidth : cellBorderWidth;
                            lineOffset = lineWidth * 0.5;
                            
                            horizontalOffset += cellSize + lineOffset;
                            context.moveTo(horizontalOffset, outerBorderWidth);
                            context.lineTo(horizontalOffset, outerBorderWidth + lineLength);
                            horizontalOffset += lineOffset;
                            
                            context.lineWidth = lineWidth;
                            context.strokeStyle = "#000";
                            context.stroke();
                        }
                    }
                    
                    if (row < 9) {
                        // Horizontal line.
                        context.beginPath();
                                                
                        lineWidth = (row % 3 === 0) ? boxBorderWidth : cellBorderWidth;
                        lineOffset = lineWidth * 0.5;
                        
                        verticalOffset += cellSize + lineOffset;
                        context.moveTo(outerBorderWidth, verticalOffset);
                        context.lineTo(outerBorderWidth + lineLength, verticalOffset);
                        verticalOffset += lineOffset;
                        
                        context.lineWidth = lineWidth;
                        context.strokeStyle = "#000";
                        context.stroke();
                    }
                }
                
                context.lineWidth = cellBorderWidth;
                context.strokeStyle = "#000";
                context.stroke();
            }
            
            function drawNumbers() {
                var row, col;
                var cell, cellPosition;
                var centerX, centerY;
                
                context.textAlign = "center";
                context.textBaseline = "middle";
                
                for (row = 1; row <= 9; row += 1) {
                    for (col = 1; col <= 9; col += 1) {
                        cell = board.getCell(row, col);
                        if (cell.value) {
                            cellPosition = getCellPixelCoords(cell);
                            centerX = cellPosition.boardX + cellSize / 2;
                            centerY = cellPosition.boardY + cellSize / 2;
                            
                            if (isCellInConflict(cell)) {
                                context.fillStyle = cellTextColorConflict;
                            } else {
                                context.fillStyle = cellTextColor;
                            }
                            
                            if (cell.isFixed) {
                                context.font = fixedCellFont;
                            } else {
                                context.font = cellFont;
                            }
                            
                            context.fillText(cell.value, centerX, centerY);    
                        }
                    }
                }
            }
            
            function drawActiveCell() {
                if (activeCell) {
                    var coords = getCellPixelCoords(activeCell);
                    context.fillStyle = activeCellBackgroundColor;
                    context.fillRect(coords.boardX, coords.boardY, cellSize, cellSize);
                }
            }
            
            function drawWinState() {
                var row, col, cell, coords;
                
                context.fillStyle = winCellColor;
                
                for (row = 1; row <= 9; row += 1) {
                    for (col = 1; col <= 9; col += 1) {
                        cell = board.getCell(row, col);
                        coords = getCellPixelCoords(cell);
                        context.fillRect(coords.boardX, coords.boardY, cellSize, cellSize);
                    }
                }
            }
            
            function drawBoardPrivate() {
                context.clearRect(0, 0, canvas.width, canvas.height);
                drawOuterBorder();
                drawCellBorders();
                if (hasWon) {
                    drawWinState();
                } else {
                    drawActiveCell();
                }
                drawNumbers();
            }
                    
            this.drawBoard = function() {
                drawBoardPrivate();
            };
            
            function handleClick(evt) {
                if (hasWon) {
                    return;
                }
                
                var boardPosition = calcCanvasCoordsFromPageCoords(evt.pageX, evt.pageY);
                var clickedCell = getCellAtBoardCoords(boardPosition.boardX, boardPosition.boardY);
                
                if (clickedCell && !clickedCell.isFixed) {
                    activeCell = clickedCell;
                    drawBoardPrivate();
                } else if (clickedCell === null && activeCell) {
                    activeCell = null;
                    drawBoardPrivate();
                }
            }
            
            function handleKeydown(evt) {
                var key = evt.which;
                var number = null;
                var direction = null, newActiveCell;
                
                if (key >= 48 && key <= 58) {
                    // Main numeric keys.
                    number = key - 48;
                } else if (key >= 96 && key <= 106) {
                    // Numpad.
                    number = key - 96;
                } else if (key === 8) {
                    // Backspace.
                    number = 0;
                } else if (key === 32) {
                    // Space.
                    number = 0;
                } else if (key >= 37 && key <= 40) {
                    // Arrows keys.
                    // 37: left
                    // 38: up
                    // 39: right
                    // 40: down
                    direction = key - 37;
                }
                
                if (number !== null && activeCell) {
                    handleNumberInput(number);
                    drawBoardPrivate();
                } else if (direction !== null && activeCell) {
                    // Find adjacent non-fixed cell.
                    newActiveCell = activeCell;
                    do {
                        newActiveCell = getAdjacentCell(newActiveCell, direction);
                    } while (newActiveCell && newActiveCell.isFixed);
                    
                    if (newActiveCell) {
                        activeCell = newActiveCell;
                        drawBoardPrivate();
                    }
                }
            }
            
            function initGui() {
                canvas.width = boardSideSize;
                canvas.height = boardSideSize;
                
                $(document).click(handleClick).keydown(handleKeydown);
            }
            
            function init() {
                initGui();
                drawBoardPrivate();
            }
            
            init();
        }
        
        this.runInCanvas = function(drawingCanvas, clientSettings) {
            initBoard();
            runner = new CanvasRunner(drawingCanvas, clientSettings);
        };
        
        this.restart = function() {
            board.restart();
            runner.drawBoard();
        };
	}
	
	function debugLog(msg) {
		console.log("<Sudoku>: " + msg);
	}
	
	return {
		Cell: Cell,
		Board: Board,
		SudokuRunner: SudokuRunner
	};
}(jQuery));

// Adds a bunch of boards to SUDOKU. It is separated from the rest of the code to keep that code cleaner.
(function(module) {
    "use strict";
    
    module.sudokuBoards = [
        "000091000000700600001003040002050406090006007078400010080309100406810000030000000",
        "060053700050900000109000003005060004200009007000100080098006500004000016000020800",
        "090057300070100900000009048005030407700001002009000080080605000903000054010020000",
        "010025000060800500002003910001070308000082001004500070000206100500000047040000000",
        "780060000000000900003001060600090100970008006001300000000200700500040009020075004",
        "031084000080300000400002700000020805800007009003900060000700002500000078060030400",
        "025010000000200300000008620008070900360009002009600070046802007102030008090050000",
        "070029400000300200000006057004000103180000004020800060038002000009640001600050000",
        "010034000000200600002000030009020001500076002000300040060008700805000003240090000",
        "010005600020400700007009014001000506200000000004800070070308100609000087040090000",
        "026094000000200000009001300003000506700010004001400020014902805005000009300040000",
        "070020000000900700002104090000010500600089004031500860005400600400800002080050000",
        "040009100000100700000005826005010903900006000001500060018204000002000007600080000",
        "000048900000300700004001538007030609000095003001000070020803400405000000830000000",
        "050082700000600200002000593005020001100068007000300020040003800509000002260010000",
        "068059000070000500009000040000080005750023004003500000000900107800030096030060000",
        "820040073000000000006935200630000095400802001980000027003789600000000000160020084",
        "070020090002090600010408050700602004800000007200701009090804020008010400040030010",
        "080701090907000301040030070800000004400298005200000006020010050508000103030405020",
        "170050068800601002000020000503000804060204010201000906000010000300406009410030057",
        "050060090001000400046291570980000024000805000630000015027154980009000300060020040",
        "010804070400306005003050600830000094200605007150000026004010800300207001020403060",
        "420080071008000300006702500380000054000407000570000092007201800002000400930060017",
        "050000060006000200040163070800407005000090000100602007090825010008000900060000080",
        "070000030005000600010354020160908072900000003540702016030627050004000300050000080",
        "630020095000000000009304200420000061010605020950000073003207600000000000240090038",
        "080000030006010700027306180000703000500891006000405000045109360003040200060000090",
        "807409603401000809000080000004607300603000407005804200000070000709000506508306902",
        "020104080001809300000020000004302600207000103009607200000070000003401500070905040",
        "087000690006070100000695000004908700300040001002107800000762000005010200029000370",
        "009000700078302140000479000801507302060000090205906804000684000026703410007000900",
        "012306940000000000706050108200080003300407001600020004907040306000000000023608750",
        "030090080009328600000604000803000506024000190501000304000405000005263800060070050",
        "005107300800602004000090000208000406100000007406000509000080000300201005001305700",
        "075000980009268500000070000506000709004501300908000105000030000007654200051000490",
        "501702030043000070000001000000300052004000600830007000000600000020000940050408306",
        "003009020012005400009001008900800000508000906000002004300100700005400680070900100",
        "008301290005007040000000000500106030204000708070402006000000000090700300027904500",
        "901400080078001050000003000710500003005000900400006025000600000030100840090004102",
        "001006500090002000060009001800700093000000000910008005600800020000300050005900700",
        "005401070746005010000007002000002060602000403010600000200300000050700926060908100",
        "109803240002006030000009006000000005701000304800000000200300000010600800098201703",
        "005002400047000030000007002600805000008000100000604009500100000080000670001400900",
        "908507000704006010003001000100900003006000100300004002000100500070400301000203704",
        "605203740900007020002000005400500009000000000500006002100000400080400003094805207",
        "009208040583000020002007000000102060007000300030704000000800600070000491060405800",
        "400002650267005900005009000900800006003000400600001007000200300006900145019300008",
        "900700140073002000004006000400000000702000306000000008000900700000300280028007005",
        "001403090009001200003007006000900001607000304800006000700300100005100800030602900",
        "001508070050000090004002000680100700400000005007009064000600800010000030090301600",
        "502406010987002040000000000000200701708000609201009000000000000010500873070903204",
        "009801500052007090000009007800000006907000201400000003600300000080200140004905300",
        "902700050130008270000006000590100000004000500000004087000600000081400063020001705",
        "000005420316008050000001003600500800902000306008009005500100000060800534083900000",
        "503107420004005700000004000640800009005000800800003047000700000006300200081602305",
        "800603070970000160003007000690800000001000600000004092000700800027000036080405009",
        "900704100072000060000002007500900001609000502100008009800500000060000750003601004",
        "407008060390006000002003000730000600206000405009000082000400500000800016020100709",
        "300507020760002090002009000180000700200000005009000014000800100020700089070605003",
        "400001070317005060000004000200300708006000900804009006000900000020800354050400007",
        "000302980842009060000004000700000308004000100903000007000700000070800431096201000",
        "108004650302000090000007000000105200005090700007402000000200000050000409049500106",
        "307009560089004000050007000020600005003000900700005080000900050000700640061400807",
        "705108260046009000000005000200900001007000300800006007000800000000400970062703104",
        "400001230329006000005002000040000902006000500207000060000600700000100385072800004",
        "009007120047000090010005000090100006001040300300002070000300010080000530034200900",
        "000001080073004020006003009060300001701000408500008070100900600050400810020800000",
        "200006390000009420006007000800100000701000905000003002000400600084900000017500009",
        "307002060654007000000005009000300000908000206000001000400500000000600752030200408",
        "806700910197005080000008000000500000409000106000007000000200000070900532023006801",
        "007902130500000070006005000070800006008000700300001090000200900060000001013504200",
        "009706000216003000040005009080300000602000108000008090300600050000800761000502400",
        "307002060654007000000005009000300000908000206000001000400500000000600752030200408",
        "800020905007360200040000760060049000000000000000610050018000040004081500503070001",
        "067010204009000130450300000040006000100080006000400070000007058082000700503040610",
        "004037806003000720010000005000006103000070000809300000200000080041000500908510200",
        "104003806000210400070000500000027000050060010000180000001000080007034000308500902",
        "063000507009850400000000010030025800000080000004960030090000000002096700107000290",
        "900045806000300900080000420000009500050070090004200000049000010003002000501690008",
        "060084720102000400040000010010046200000090000007820050070000060003000109081360040",
        "030007604000600070700800300080069000020000010000280040004005001050006000302700050",
        "007092035003000090058700040070039000000080000000160020080001250090000100210540300",
        "760080100008700200030000080070094000050000040000360050010000030005002800009040025",
        "076089003105200600040000000010042005020000070500970030000000010001005806700160320",
        "023001008000450000000000430080014900040000060001520040098000000000042000600900310",
        "000078205008900300040000080030012900080000050009680030090000010001007500604890000",
        "061074203000030700040000000020061400050080030004950080000000070008040000702610840",
        "704002009001530000000000050080001200020080070005300080070000000000063900600100308",
        "061027003002100000090000400050082000030000050000370020003000080000001600600840970",
        "000041706009000580010500020080002300070030060002700010020009030035000600801320000",
        "608000975007300600050000200040069007000040000700820060005000080004002100276000503",
        "004037806003000720010000005000006103000070000809300000200000080041000500908510200",
        "104003806000210400070000500000027000050060010000180000001000080007034000308500902",
        "063000507009850400000000010030025800000080000004960030090000000002096700107000290",
        "900045806000300900080000420000009500050070090004200000049000010003002000501690008",
        "060084720102000400040000010010046200000090000007820050070000060003000109081360040",
        "030007604000600070700800300080069000020000010000280040004005001050006000302700050",
        "007092035003000090058700040070039000000080000000160020080001250090000100210540300",
        "760080100008700200030000080070094000050000040000360050010000030005002800009040025",
        "076089003105200600040000000010042005020000070500970030000000010001005806700160320",
        "023001008000450000000000430080014900040000060001520040098000000000042000600900310",
        "000078205008900300040000080030012900080000050009680030090000010001007500604890000",
        "061074203000030700040000000020061400050080030004950080000000070008040000702610840",
        "704002009001530000000000050080001200020080070005300080070000000000063900600100308",
        "061027003002100000090000400050082000030000050000370020003000080000001600600840970",
        "000041706009000580010500020080002300070030060002700010020009030035000600801320000",
        "608000975007300600050000200040069007000040000700820060005000080004002100276000503",
        "004037806003000720010000005000006103000070000809300000200000080041000500908510200",
        "104003806000210400070000500000027000050060010000180000001000080007034000308500902",
        "063000507009850400000000010030025800000080000004960030090000000002096700107000290",
        "900045806000300900080000420000009500050070090004200000049000010003002000501690008",
        "060084720102000400040000010010046200000090000007820050070000060003000109081360040",
        "030007604000600070700800300080069000020000010000280040004005001050006000302700050",
        "007092035003000090058700040070039000000080000000160020080001250090000100210540300",
        "760080100008700200030000080070094000050000040000360050010000030005002800009040025",
        "076089003105200600040000000010042005020000070500970030000000010001005806700160320",
        "023001008000450000000000430080014900040000060001520040098000000000042000600900310",
        "000078205008900300040000080030012900080000050009680030090000010001007500604890000",
        "061074203000030700040000000020061400050080030004950080000000070008040000702610840",
        "054000000800030700209040000000050093026900000000007086070000000000203010000105008",
        "000700000050002008004050300700080062002140000010000500008001905000200040070900600",
        "043006000200015000605070000000900030091050000860000051000000604000703020000009700",
        "890004000100020000005009400000000038050090000206008054003000107000603040000401500",
        "098600000740001000200090000300700020009020000080003079000000205000408060000006704",
        "026008000300090400900410000003020067082600000100004000070000306000500040000900200",
        "005001000080040100207060000000290003078400000600000700020008400000000075000500090",
        "023000000800056000409020000000170036075200000080000021000000402000705090000602103",
        "006708000010054000403020000700980003028600000960000078000000302000003010000807409",
        "073004000480020003900060000000000004062090000800005190000008005000003060020900400",
        "089400000520000600400090000100300005002080000000000814090001000000007001000204070",
        "020901000910008000005060000500140086007500000640003095000000908000602040000804200",
        "029001000800520000400070000040000008076030000100000340000004702000009013000100580",
        "000806000000097200009050600500380006097410000820000009016000008000000090000508104",
        "005802000000030000903016200300000076086000000502009004009000307000900010000201409",
        "036001000400600001900050800080000049004020000100009080007000006000107000060500703",
        "010708000370020000002060000200070068056810900900006050000080005000501020000300701",
        "930600000160008000002050040200040018001200000040000003000000409009300080000402701",
        "071005000390800000605023000040050061007400000109006040000000006000509010000300508",
        "050204000800060000007050100100020078073400000600009040001000805000701060000500900",
        "090005000150074300004920000005700030021050000370008009010000002000200050000006901",
        "080000000970048000003020500000050017026780000040000009008000602000800090000305400",
        "009600000000089000400070100600500083017000000050000007003000905000900040000304806",
        "048200000960031000201090000300610070072940000080003001000000908000100020000005607",
        "051607000600080000908000000700090082060250000800000041000000906000309010000804200",
        "009003000060050000204071900000094010035200000907100000006000408000800020000000309",
        "070109000920080000008050900100020060065400000400000028006000007000705080000006301",
        "080400360000060050000080409000000100450601027006000000508040000090050000021007080",
        "000408020000637010800000405000000650340905082085000000108000004050784000090103000",
        "400500020300070040000060703005000390060704080042000100807040000090010006050007009",
        "800105000300060070000070100085000017030209040420000590009030000010080004000604001",
        "300008000000040030100030487030000240070000050016000090495080002080090000000600008",
        "900702080000060020000040705040000590100000008062000030408090000070080000020607004",
        "800401020000000060300050409000000803730904056504000000402010007060000000070602004",
        "900105020000000030000030908040200301010403080803007040706020000090000000020604009",
        "900100060000030020100050308070000000810604079000000040302040001090060000060001002",
        "700904000000010060500070300360400080950000037070003094007020008010080000000706003",
        "800106920000002080000030106000000650080605010026000000601070000050400000072508009",
        "600100350000052100000080607000000863000304000327000000804030000009420000075001006",
        "700900050000067030000020007060100920590040013017009060600050000050310000030008005",
        "900107000100000090000030206010700050490050073050004020604070000080000001000208009",
        "500408020000010060800050907000000610410807059056000000605090001040030000030504006",
        "400503020000090060500060403090300000070040050000002010807020001060080000020601004",
        "500109030000020060900080001000800510020513090059004000200060004090050000040701009",
        "700300680000026070000000104050000200030407060009000040105000000020710000048009006",
        "910400780000020000800090401000000630030589070094000000301060008000010000089005013",
        "700502000000308720000040005000000850280603071079000000900070000024901000000205003",
        "100405090000080000900010702040000930000807000069000050703020004000030000020901003",
        "900708040000040060000060802050000010840607025070000030103080000060050000020401006",
        "500800000000930080400060001050000720000798000097000030600070003030089000000004002",
        "000607030000020000600080417040700200180302095006001040769030004000010000010906000",
        "100000058600080190700050002020600007030201060900005020300060005076030009840000006",
        "320700010000050040000030006940500200000407000008003079100060000090070000060004051",
        "630807000000060050200010600013500080500000007060001540001030005080020000000706019",
        "600000070000508010000040908010000802020401050507000030406020000090103000080000005",
        "000903005900067030000000801000000120030509040014000000305000000040650003800301000",
        "900002080000860090000050704000100030170403065040006000207080000060014000090200006",
        "300902000000000040400030010000600102060451090709003000020060007090000000000805009",
        "500203010000040000000000523000100098980060047130004000625000000000010000010709006",
        "000000705300058100500020060000000490600105008071000000080030002002870009405000000",
        "400503080000000020200090503080000700150782039009000050607030005020000000040207001",
        "800106920000002080000030106000000650080605010026000000601070000050400000072508009",
        "600100350000052100000080607000000863000304000327000000804030000009420000075001006",
        "700900050000067030000020007060100920590040013017009060600050000050310000030008005",
        "900107000100000090000030206010700050490050073050004020604070000080000001000208009",
        "500408020000010060800050907000000610410807059056000000605090001040030000030504006",
        "400503020000090060500060403090300000070040050000002010807020001060080000020601004",
        "500109030000020060900080001000800510020513090059004000200060004090050000040701009",
        "700300680000026070000000104050000200030407060009000040105000000020710000048009006",
        "910400780000020000800090401000000630030589070094000000301060008000010000089005013",
        "700502000000308720000040005000000850280603071079000000900070000024901000000205003",
        "002000090600000005080006700040600900051890000260043000003020004000734200000900070",
        "009100040570000301030000590010700000093650000000981007000020003000064210200000070",
        "007009050040100908060000040080000002014520000700090080000070009000016820600900000",
        "007000000030082100090001470100000760040060090200000000005000004000030820700206000",
        "008605000040070000030008000890001306050020080200000001001000008000037590300802000",
        "000000020000534807030007650580003270024070090300000040002040000000029400900608000",
        "006002080070090002050000900030509008005310040010068000001080009000203850700000000",
        "001800030060070002020001400000009100096420080200080004009030005000040370800500000",
        "001000038020600007030001600080007200014080000700000090002040001040019720000800000",
        "009002000000610700060009150030000906082400010700030080001090003000087600800200000",
        "006000050070960003020008000040009100008600070750020090003070001000206530500100000",
        "002009030000540102010000950830000004029470060000020090000030001050094300700001000",
        "000000090080905706020007480390006240040130000800020030004000000000074960900502000",
        "000007000520100900090000340070004001049500000100070060003010000000089620000700050",
        "028035040000010003050000000080007002000600094003020000006700008030004107400000000",
        "007000030050060001060007800580002400094800060300070000008050002000021380200709000",
        "004001070030002405070000190060007038001260000300080000007020006000008720400600000",
        "003005060010430509020006380030007601091300070000040090007050008000024710000000000",
        "007408090090020007080001000350000206012050080900000003000040008000065170100807000",
        "000302050020980007070000400038000009700400010400050028006009000000005890500810000",
        "007001040090300805040000070560000004030260000800040050006000007000057430700406000",
        "000207000090050040012000870300020005004509700600070002076000390040060080000704000",
        "004506800000981000900000002270060084000000000410070096300000007000713000001605900",
        "093000610004608900000000000200090004076405390900080001000000000007103500062000180",
        "007000500010607090080403010520070083001508200840010057050201070090706020002000300",
        "009701500000602000070809060706000201004000600802000304060208090000304000008905400",
        "001703600070000020400020007302040806000601000907050103600010008090000010003508400",
        "000705000050148020040020090025000940000269000063000270090080030010976050000401000",
        "030000050004572300007090600480060037000000000710050086006030100005917800070000020",
        "007000800000306000940070062750000021031804790420000038190080053000902000003000900",
        "006000300000692000020010050408030201002000700903080405080050010000326000009000500",
        "003000900010702050090103080940080026008209400370050098020406070030805040007000300",
        "001000300000982000090103050018020760005306200064070910040208030000591000009000500",
        "000708000070102060060040070740000036098000540650000087010090020080507090000306000",
        "005000800010000070800607009600090008087000460200080003400301005030000090006000100",
        "000000000004968200065000490600030007043000860100050009058000170007312600000000000",
        "000409000040567030060000020605040802004108600107090403010000070020914080000806000",
        "000102000010090050640703019750000046000000000160000073480901035020040090000508000",
        "008705400000010000320000051090080040004203800050090070560000084000040000001908500",
        "008000500020070030040208010701000305005847100204000809070604050090010080006000700",
        "003000200090502070010080060100020005028305490700090003040030050080204030001000900",
        "006103200090000060013000540020080010001206700050090020039000670040000030002708400",
        "004000300020040050560903048710000034000406000640000089830209071050070090001000500",
        "007605800000184000010000050603000408090000020802000703080000070000761000005908100",
        "000705000050148020040020090025000940000269000063000270090080030010976050000401000",
        "030000050004572300007090600480060037000000000710050086006030100005917800070000020",
        "007000800000306000940070062750000021031804790420000038190080053000902000003000900",
        "006000300000692000020010050408030201002000700903080405080050010000326000009000500",
        "003000900010702050090103080940080026008209400370050098020406070030805040007000300",
        "001000300000982000090103050018020760005306200064070910040208030000591000009000500",
        "000708000070102060060040070740000036098000540650000087010090020080507090000306000",
        "005000800010000070800607009600090008087000460200080003400301005030000090006000100",
        "000000000004968200065000490600030007043000860100050009058000170007312600000000000",
        "000409000040567030060000020605040802004108600107090403010000070020914080000806000",
        "000102000010090050640703019750000046000000000160000073480901035020040090000508000",
        "008705400000010000320000051090080040004203800050090070560000084000040000001908500",
        "018000520020070030040030010001906300900807002004103800070090050090010080056000790",
        "005416300030000090040000080002761500071803640003294700020000060010000050004629800",
        "004806900082000540000543000006205800030000020008607300000419000071000460009708200",
        "002108400070000050040257080003406900020000010009501800080915060010000090005703100",
        "008209100090000060000476000009601400030000050004705800000197000080000090005804300",
        "081070940020000050000841000008703100006050700007408200000697000040000070072080690",
        "040706050010000070070090030003502700085601240001904500090050010030000020050403060",
        "008326100061000980000108000000563000190000036000912000000401000075000410009235700",
        "005070100740000098000106000003401900070859060009307400000205000950000014008090500",
        "020538070030000080090601040009802700310000094005403200050107020040000010070246030",
        "700834009800000005040502060000105000007020400000608000020309010100000008300481006",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "094000760107000302000060000002108600300206004006704800000080000608000207015000430",
        "081752930000000000020934080003000600590603012007000300070598060000000000049217850",
        "001203400003000100020090030002409300080602010004501800060010040005000200009704600",
        "608090405047000920000254000000975000230000097000362000000716000063000170901080602",
        "082537160000000000060108040006000700093602510004000300040701030000000000059324670",
        "036807420012000750000231000005608100080703060003405200000349000058000640097506310",
        "006080900001090400400703001014000260300000009068000710800206007007050300002010500",
        "004000065000000382000007140400000600081200000050030000730080006008510000205009000",
        "005000084000000103000006750000900300061730000903541000610850002009010000807300000",
        "003000072000000509010003080060900300251800000000051000108060003000078400006090000",
        "005008092000000007000005100003000406420150000508070000860507009001080000304290000",
        "003000094000000803000004250001600300860300000402071000310402008708090000024580000",
        "009000082000000164000006530007800400610000000980001000090007003208930000070560000",
        "005000070000008506000007490900500260001000000507302000400720008600000000083601000",
        "604000010000000824000007090005600300048730000700082000507024001000070000006800002",
        "002004038000000504000006290009100306080070000001409000620507009008030000507000000",
        "508000060000000801000005090001000300285010000300700000170032009002070000003650004",
        "709000032000000894000009070000000400392600000400790000931020005005080000207150006",
        "004000081000007902000002540000300290650740000000025000410000003009030000308010000",
        "006000072000001608000006090004000380070540000200030000350004007107090000462300000",
        "005000039000000607000006040001900400390500000604132000710403002406020000038650000",
        "006000080300000407020007010031700200940200000200059000600002005000091800009570060",
        "084000019000000506090005720020900100040060000100004000860000005009037602002600000",
        "006000074000002301000006050001000790000340000270910000980003005105200000042800000",
        "098000016000000705000003940070200100801300000000014000160040003005009007409060000",
        "801005062000000089076001000000000804040650000200490000520000901008070500009500008",
        "003000070000007401000006050806000240030600000970320000490003007208760000067905000",
        "005006082000000601000004390000800403160400000400079000080000006507080000030150000",
        "405000063000005071000004000800000920030600000000710000718000005306020000052007006",
        "002000096500000203030004870000900700023000000800401000250060007001040600309700080",
        "000050010000000502010002090009100400042700006800065000490073000001080300507200000",
        "009000070000000105060009020008600900920400000700058000085006003001040700400820000",
        "406000080000000943000003050003100500041050000500708000870036004004010000309400006",
        "006000020000000406007002090004000300731950000000820000460039708003060000905070000",
        "507000090000000387000007420000200100304000000270006000450090002609800000023560009",
        "003000082500000301010003070000400200905200000700986000350070004001000900008140050",
        "006000080300000407020007010031700200940200000200059000600002005000091800009570060",
        "084000019000000506090005720020900100040060000100004000860000005009037602002600000",
        "006000074000002301000006050001000790000340000270910000980003005105200000042800000",
        "098000016000000705000003940070200100801300000000014000160040003005009007409060000",
        "801005062000000089076001000000000804040650000200490000520000901008070500009500008",
        "003000070000007401000006050806000240030600000970320000490003007208760000067905000",
        "005006082000000601000004390000800403160400000400079000080000006507080000030150000",
        "005000060009005001170860000800403020000000000090702008000096045300500700050000300",
        "070000050005807040380500000860200700400000006001006084000009061020305400030000020",
        "000000015009007006130020000300409060200000001010206007000090084400700200890000000",
        "080000030106500004050420006900704050000000000040903008800076010500002703070000060",
        "008000050203940008050800006610703000000000000000108039500009070900051802080000500",
        "020070040006500002010800003950300000600050009000004067200005010700003900080090020",
        "000000090002000006390850007900608040000030000060907001400091075200000400030000000",
        "070000090409503007100070000890402030700000009040907026000020008500608103010000050",
        "200000560003500009090200004180607200000030000002104096600005080900006400038000001",
        "040000020801600095790500000030700000400000002000008010000009076580002903070000080",
        "010000650400706002020800000070601900600000005004205010000009060700408001095000080",
        "080000090004307005070060000120006030800000004090100068000050020300608900040000080",
        "000000500008200004023960000050000900700104002009000080000048270900007800005000000",
        "030000050205103006090850000670508000900000002000902017000075040500201308060000020",
        "040020090103900005900140000360200500800000004001004062000069001600007409010030080",
        "001080000903720001820900070687000000000000000000000142030009016100056907000040200",
        "006000070108029004004050000900076010000804000080910005000040200800290506070000900",
        "002000030406810009300090004670900040000000000010006072900030006100085403020000500",
        "006000490108050003470190000500008240000000000032600005000034068600080907081000500",
        "070000823005100006820670000300005200000000000006400005000096051900008600563000080",
        "040000000709604000630750000520409000800000009000108074000096045000503901000000020",
        "009000000500201006260950000630809010100000004090602078000026087800703002000000100",
        "090000028402908003850020000730600000900000006000001087000070051600105702570000060",
        "010000978200400013070100000160200000000050000000008029000004050380001004421000080",
        "030000020801600004070900000590002080300000001040300062000001040400003208020000010",
        "080000016003006000560820000130705020400000003070302085000014037000900800790000060",
        "040000280900005000700900000410700930200000004069004052000003005000200001021000090",
        "026010070003500002810040000200308050300000006080209004000020043100005600040030520",
        "040000200109705003030820000370000600900000005006000089000098070500401908004000010",
        "090000020403060007000380000810700090700000002060005083000078000100040506040000030",
        "008000020406801009210700000080307090500000001020406030000003064300904207040000900",
        "004000070906204005070580000200105090000000000090308002000039080300702904040000500",
        "090000060005804001041070000010080000700301002000090080000030270500209600060000050",
        "000040090608100002019800000040210000000504000000037060000001340100008207020060000",
        "008000040501602009070490000200005070000000000060700005000063090700104806010000400",
        "070001020004780006090600701100008070000070000050200004703005010500027400080100030",
        "090056200600000003003001700000400600400010307501000000309280001000000000080040900",
        "800249000000000802005006000400600000200035914301070005040050009000060000060024700",
        "000401800090008006008090200200000000001089500580040009402030007000000005030005620",
        "400096000000204090000015800070900600509000083264000005007400008030020000000068700",
        "900080700070400100000007400080000000500040360006000002842050003000030008000001640",
        "600007000000201040000060902070000800004038000950020004002400005010000000007002100",
        "700092800020000007006000109000400000900017500500039008607020005000000004091005670",
        "300200000000700906006019207530900000008027040002060001089000003000070000073002100",
        "100530000000100693004000000640700800700050916000000004020390001050070000030015700",
        "200340000000009408000056300300900000509010203067000005034070006000000000070034100",
        "800024000000900456005003000060700900700000041309000002020100008070090000080047600",
        "020080400600000092005090800000100300201038500000050009803270000010000003090004050",
        "700460000000805204000079300360900000408002060071040000047000001000080000090000800",
        "300048100000906020009020400070000200501000007960000003205800004030000001000013760",
        "500078100000400608000030200030900000108020030200001005713000000000090004090006010",
        "300091000000005031005060700000600500402000309670000004006130007010000000090082600",
        "000902000000300028003054700730400100001070056504000007006800000090040000070021000",
        "790002100500304072004000900050900000000003007140060000401000008020000009070020640",
        "900620000000000042002009600800000500400051308003080007005190003030000000010036700",
        "000649100000501009005000300790000000300028090840010005503000004000070008080006920",
        "000417000000900321000000000540000800300079006800040007070100004080000000050063200",
        "700069000000800007002003506020400700400050360905000008009230001000090000043007800",
        "300091000000005031005060700000600500402000309670000004006130007010000000090082600",
        "000902000000300028003054700730400100001070056504000007006800000090040000070021000",
        "790002100500304072004000900050900000000003007140060000401000008020000009070020640",
        "900620000000000042002009600800000500400051308003080007005190003030000000010036700",
        "000649100000501009005000300790000000300028090840010005503000004000070008080006920",
        "000417000000900321000000000540000800300079006800040007070100004080000000050063200",
        "700069000000800007002003506020400700400050360905000008009230001000090000043007800",
        "300091000000005031005060700000600500402000309670000004006130007010000000090082600",
        "000902000000300028003054700730400100001070056504000007006800000090040000070021000",
        "790002100500304072004000900050900000000003007140060000401000008020000009070020640",
        "000620030061803040080000005820360000400701000050080000000000083730000150008000700",
        "700480090003209050040000001370054000500308000080760030000000016410006870007000500",
        "800620090004000030070100400109085000700306000000940070001000085490007200000000300",
        "009000060007816040560000300070201000050008000030640070005000004680002030000000108",
        "400080020000100030000000608080567000100920000000800090008000053620005400004000206",
        "000090030002304060050800009034925000100400000080700020000000052570003190001000700",
        "400090060086001070070000004000018000300500600060300080000050092590002400004000500",
        "200000090014309060050000304080136000000800001030500040005000008340005020002060400",
        "800200030005009060010000407700032000000500009050600080004000073580003600007040500",
        "000650040004008030070000002100264000400805000080790010000000091390001850008000400",
        "100200000048009070050000106800395000000102000030480010003000090070003280009000007",
        "700090050040002710000700003006280000800306000090074030080000076250008300003000200",
        "100090070009005200070000601000107000500006000080450020047000012900002850008000400",
        "200000010079006020060200007002039080000107000030420090000000001750308000006000503",
        "700900020060805030000000004210059000000600001050100040000000083140007600003040200",
        "800000030007009010030800702002158000000407000050230080005000067960005800008000400",
        "800030090002906030010000605040002000300059000080340010004000021290001500001000400",
        "900020070052801060010000802060235000800700000040908000004000019190000600008000405",
        "000000020005001370030900001008097010000306000020450000080000062150600730006000400",
        "000060030005007080030000506000459000500130000020800090008000063150008720004000809",
        "800620090004000030070100400109085000700306000000940070001000085490007200000000300",
        "009000060007816040560000300070201000050008000030640070005000004680002030000000108",
        "400080020000100030000000608080567000100920000000800090008000053620005400004000206",
        "000090030002304060050800009034925000100400000080700020000000052570003190001000700",
        "400090060086001070070000004000018000300500600060300080000050092590002400004000500",
        "200000090014309060050000304080136000000800001030500040005000008340005020002060400",
        "800200030005009060010000407700032000000500009050600080004000073580003600007040500",
        "000650040004008030070000002100264000400805000080790010000000091390001850008000400",
        "100200000048009070050000106800395000000102000030480010003000090070003280009000007",
        "700090050040002710000700003006280000800306000090074030080000076250008300003000200",
        "130094070009000000470003600004120080000030000080059100007500012000000800050970063",
        "100037020000000000308006400004560001006000800800041200005600703000000000030780006",
        "460093000007000000539007000005700083003020600780006100000300764000000800000870059",
        "820010000000004000015003400009760820002000100051082300008500710000400000000020038",
        "360007020000000000005900810006730098003000700790086400048009100000000000010500047",
        "950860000300000000008009500000028001003070800100640000009500100000000006000094023",
        "200040010900800000015003800051700040000050000060008230007600480000009007080030001",
        "702306000000000020863005700000000094004080300970000000007500932050000000000604807",
        "940030060006001000580004100000000207004070500302000000005300048000200600090050023",
        "000490050009000030100053900000030019003080500810040000002570008060000100090068000",
        "410030020005000000039001000004070061007040800920080300000700510000000900040090078",
        "920501060000000000671003200000130006009060800100079000004300927000000000030902048",
        "390047060000000000547009000004130009005020100600095700000500374000000000080910025",
        "958310020006000000470009600000400063001030500380005000005600072000000400040057316",
        "302470090009000050001005000000580024006040900420016000000100500060000200090028307",
        "150069000000100000064003020009350078000000000830046200040900350000005000000410092",
        "810300020900024000004006000000005690003000500058100000000600300000270001060009072",
        "070348000000000000062005800007800052004030100210007300008700490000000000000682010",
        "120097050000000000493001600007950030009000500030028700005600218000000000040370065",
        "732100080006000000400006000000670098009050400810024000000200009000000500050003124",
        "478205030001000080020000000000490027005000300840037000000000010080000700050701892",
        "030794000000000060720008100009160020002000500060045900008400095010000000000987010",
        "580007060000500000031002700010680079004000300760023050007200890000001000040300021",
        "290003000300070000478000900000036490004000500057280000009000376000010009000300041",
        "720040080300007000896000000000720605002000100609051000000000561000300008080010079",
        "200860040900007000300002900000401650000050000042608000006900004000100003070086001",
        "720500010000020000918003400003052001009010600100360500005700283000030000080005064",
        "390527000000000090471009000008170000003000100000034500000800415080000000000416038",
        "840056070100000000320000900004200508000040000508001200007000029000000007090870036",
        "290073050001000000374005000000720036007040900620018000000800594000000100010950063",
        "600050020009000000470001300000720004005040900800039000008600031000000700020080005",
        "900401030000000000714002800008609050001000400050804100009500316000000000060108004",
        "070235060000000040680004300008450000002010600000063100004500013050000000010327050",
        "900027060001000000200005800009450080005010300020069400008500003000000600010670005",
        "530906020000000090029007000001080002006050900300060500000200670080000000010405083",
        "840197000000000080210038900000780053000060000730024000008250079050000000000879065",
        "620810070005000080000009600000190065009030800170086000001200000050000400080043017",
        "000834000100560030000000640037000002006020700200000390065000000080042009000657000",
        "000861700000040030000000180063020908009030600107090520075000000080010000001257000",
        "000842090300600000000000020067080005008070900500030270070000000000009004050167000",
        "700093024000482000000000000075000903008607200203000480000000000000529000940370008",
        "000709650000520080000000300018050406007080200906010530003000000070031000069804000",
        "000206013000340000000000960078050300002000600009030840087000000000061000240809000",
        "500607040000021000000000370018090400002000600009030250061000000000960000090204003",
        "000561008200908010000000300047050103001000200603010940009000000060103004400296000",
        "900072180000000030000030420041020908008000300209040610094010000060000000083950004",
        "300071906500380070000000000012000607003010400609000530000000000090064003807230009",
        "000700086000329050000000130005040603000507000908010200029000000050234000670005000",
        "000274085000300000000080120071000409004000500902000610069030000000005000850916000",
        "000907006100640030000000270093080000000701000000090480048000000020068001900405000",
        "070194000000380000100000300087020003001050600500010490008000009000035000000841060",
        "000097140000530060470000500010020306003000900906080010008000079040072000057810000",
        "000518630000300020000020700080000109004060200106000050001070000050001000027635000",
        "000023400000740000000000290010000706008206300304000010047000000000059000002180000",
        "000160403700320010000000500029070100006000700007050360002000000030019004801043000",
        "000069080000804020800000100064020003001000500900070240005000007090106000040980000",
        "000246050000070000000005890086000302009802600107000940063400000000050000070681000",
        "030801074000970000800000900019000703000507000702000840007000008000056000620708090",
        "000412036000095000000000490056000302002104600107000850013000000000920000680531000",
        "000005034000067000000040950041000607009000500502000190027080000000150000390700000",
        "000468003500100000000030420020080509005000800806090070071040000000001002400359000",
        "900152380000060090000000210006090502000000000705080600057000000020010000019538007",
        "000546800000810000010000540047050602009000100106090780024000050000024000001685000",
        "000763004000842090000000070029050407008090300401070250080000000030581000200437000",
        "000048060000500020000000890089060304005010200704020950091000000030001000040250000",
        "000709650000520080000000300018050406007080200906010530003000000070031000069804000",
        "000206013000340000000000960078050300002000600009030840087000000000061000240809000",
        "500607040000021000000000370018090400002000600009030250061000000000960000090204003",
        "000561008200908010000000300047050103001000200603010940009000000060103004400296000",
        "900072180000000030000030420041020908008000300209040610094010000060000000083950004",
        "300071906500380070000000000012000607003010400609000530000000000090064003807230009",
        "400700086006320007500008100000002600200000010040600075000000040850200000070080301",
        "950800230002370009070005104000001800700080040000000073008000010200000306510020008",
        "450900031007100009003005200000007800200000000000400015002000950760000003540060002",
        "130600480008450006000000502000001000900040050010500093001000060500200008490060001",
        "900500246001970005000000001002000000400030010080000079004006080300100000560080003",
        "950480300003050000800009201000002600200060018010500003000000070780600002520070406",
        "050070201006510000070004906000005400800000029030400060001000030700600105480050000",
        "350800490000071008080009001070006950500000070000000004004000000730004105610090003",
        "050700008900008040400020600600050010000901300009370002000400000500000001010003960",
        "010200004500004090064070000000020070205036800300700005000050200420000907050690080",
        "040950000050006010200740500000000070007800902000320601000010000430000069090000800",
        "060000000700008090293700000000050020308102000000840900000020500950000706030070480",
        "080600009040000000016070500000097000900508400300420006000000700600000182070830000",
        "020040009900002000054900100000056020005701004040230600100080500000100203006000070",
        "030100002000007000648000300000054010403609000000280004000060100700000205020010600",
        "080000006000004070021730800000072040009001500000500200000050100360000702040000000",
        "040600700100005000096000801000049030502036000000000002000010500900000406070060010",
        "000200700200005040008600005000034020501006000020700901000070300100400000090060010",
        "000060500500002000012080007000078020104005609080000000000030400400600700050090010",
        "030000000100002080094850100000020030900045800000900600000000500370000908060070010",
        "080940000250001000710260900000029010802006709000300502000070000070000185000010690",
        "040890005000005010080000400000040050009521003500960002600010000400000309098300000",
        "000700000010903060803040000900800000570020098000005004000030501090506020000002000",
        "050200000000007049609000003400038000030000020000610007200000801960100000000004060",
        "030100020800502079902040001300004000040000080000900004200010506580206003090007010",
        "020000000090108023601070000200801000850907042000504008000080405460205030000000090",
        "050000000080102050203000004309008005020904070700200108100000407040503060000000080",
        "020000000850904000304080000600001042039000860540800009000040208000205097000000050",
        "000400000060002019903000002207901005050000090100508703800000106470600050000003000",
        "020000000070259018508010007300600000080000070000003004700090405950361080000000090",
        "600504003500020001002080700800040007030701020100030005005070900700010002200309004",
        "508000609140060057900705001009050100700000008001080900200901006690040013407000802",
        "305204807900000004007108900400080002080000060500070003004905600600000001802706309",
        "300704001000000000104503806690070035000000000470050068201405907000000000900106002",
        "809000607300040002004756900000080000040107060000060000006598300500020006103000809",
        "003702400200030009007401800350000087000000000810000062008509100400010006009604700",
        "000604000400000001205070408310080069090000050850090012503040107100000006000208000",
        "007305100300000009002498700700020005020504090600080004005643900900000006006907500",
        "904010705000090000008742900600000003010206080700000004006539800000020000501060402",
        "009000060030090207800000900000068500050170000000300010085900041600002300070000605",
        "004000070071000628250000301000051200000800000000204800035407080140000900086000002",
        "001000090040080005500000817000071300060900000000206400007409080403000900089000003",
        "008000000000030092700000146000145908050390000000700500001409050075000600042500000",
        "001000020062000009340000016000637200000180700000502000000350072409000500025000104",
        "007000080048000003160000059000016902000250000000400800000601090304000210081300004",
        "001000060040000009800000517000682703000530000000700890009301000602008000034900000",
        "000000010040080256000000903000723600060900000000805000034600089150000400029000500",
        "005000030021000005390000017000738602000910000000206000000500040602000800087600001",
        "009030040070000002800000653000206400700000500000401000002940070307000800086000000",
        "006000040074030090250000673000000302060000000000002950009807060427006800001400005",
        "001000060045000080980000702000208307000090000000100800002407090310000500006900000",
        "004000050016050009290000680000093407020600000000201000001900060509000200080300005",
        "001000040042070000370000086000047801020930000000500200000705030503000610004300000",
        "009000070007050980420000005000802300080060000000509000070300016130000700008000509",
        "009000010018070040650000092000982300040750000000304000000500037985000400007000500",
        "006000009000900000807006150060805301508603902301207060015700203000002000200000500",
        "008001002000400006100095870070150000004030900000024010089540001400008000300700200",
        "004000009000900600009041580070035000300010004000760010018490300005006000900000400",
        "008009002006000001000086000080530000430208095000094010000940000100000900200300700",
        "006000000000800304400051080060503020002706100050902070040230007205004000000000200",
        "007000009000200504100090360010963070000000000020417050071050006908006000200000900",
        "006000003000000900900065120000520700209603501005048000032450006004000000600000200",
        "003000002000600500100005960020510800300709006001086070045800009009002000800000600",
        "000000008009700100607035090000510006802000501500023000040950207005006300700000000",
        "003000004000000209060029810000097000809050603000130000034570080908000000500000400",
        "003080006000000240600072510000068000807000609000150000029840005084000000700020800",
        "004000001000200700300071860080600400009438100001005080017390002002007000500000300",
        "004000000007580000300072860070958601000000000408631020062840009000017200000000100",
        "050148020010050090008060700006000900240000086001000400005090100060010040070835060",
        "000050000000823000079000380008304500400080007006702400025000670000476000000090000",
        "900705002000060000086020130007106200100000005005802300061040850000010000800603004",
        "300090005001804600004000900040307050006000400080502060009000500007405800400010002",
        "000305000004908700308000901007809400010040090009106500803000209001603800000702000",
        "000000000001823500680050034009102300250000097003507600510030069004679800000000000",
        "000409000006070900900805001809000107170000046402000809700106002001080400000304000",
        "000000000006708900980602037008154300300000004007893100870301095003906700000000000",
        "000371000000000000103504608201708905004000100506103407405806701000000000000417000",
        "700000008004080500018090260000649000400708006000312000086030790003060100500000003",
        "000020000000106000014309620408050306300000002106040709079504230000207000000010000",
        "200000008008701300040080020007249600300000004006513800030090050005304100600000007",
        "090001407001700060420009008070000509002000000003000080000940070500003604040000200",
        "085000003004013020630000000800000010000900080071020000009800037040100209500009600",
        "002030007000064200500001090000700540000800071007043000309400008740000000081000700",
        "092070000007381500000000060800000050000000038061000070008600045070400001200008000",
        "085000003004013020630000000800000010000900080071020000009800037040100209500009600",
        "002030007000064200500001090000700540000800071007043000309400008740000000081000700",
        "092070000007381500000000060800000050000000038061000070008600045070400001200008000",
        "085000003004013020630000000800000010000900080071020000009800037040100209500009600",
        "002030007000064200500001090000700540000800071007043000309400008740000000081000700",
        "092070000007381500000000060800000050000000038061000070008600045070400001200008000",
        "085000003004013020630000000800000010000900080071020000009800037040100209500009600",
        "002030007000064200500001090000700540000800071007043000309400008740000000081000700",
        "092070000007381500000000060800000050000000038061000070008600045070400001200008000",
        "085000003004013020630000000800000010000900080071020000009800037040100209500009600",
        "002030007000064200500001090000700540000800071007043000309400008740000000081000700",
        "092070000007381500000000060800000050000000038061000070008600045070400001200008000",
        "085000003004013020630000000800000010000900080071020000009800037040100209500009600",
        "002030007000064200500001090000700540000800071007043000309400008740000000081000700",
        "092070000007381500000000060800000050000000038061000070008600045070400001200008000",
        "085000003004013020630000000800000010000900080071020000009800037040100209500009600",
        "002030007000064200500001090000700540000800071007043000309400008740000000081000700",
        "300000004007000500080942060800010006709204108400030002010627040006000200200000007",
        "000000000406020309051309470000403000390206087000907000027801590903070206000000000",
        "500102003000000000610397085006000800370000042008000300890523064000000000100406007",
        "600050007203000504700108009000269000080000030000837000300605001409000206800090003",
        "800010009503000701790205068000761000000000000000598000470109085308000107900070004",
        "200000003603090104010406090000954000050208010000371000080509030907040502300000001",
        "000706000601030204340000067000305000020000080000102000930000072704050901000903000",
        "050043000080500000140080000000090008000007604091300070300800000000100765007000200",
        "820000000000092000130700000018079050000008040075600800001805000000904506000000302",
        "080030000040517000750000000007050060000003092063200010800102000000900781006000200",
        "800074000046032000230900000003090072000003014004700900001805090000000480000000205",
        "309006000010830000570400000004080009000005060030900820000001004080300190000000307",
        "000670000095000100206000045800019050003000900050280001460000203001000490000034000",
        "000590000072000000000270839006050003005602100100040500853026000000000270000015000",
        "000950000004000190007000060905070002006302800200010607030000900061000500000067000",
        "000190000010000600800600509700060040908403702040020005402006007007000090000081000",
        "000710000007600080401050970100090050509000203070030009095080401020005600000072000",
        "000500000058000300607010020800026009001000200400380001010070805009000640000002000",
        "000200000050040760009610042800070091006000200970020004580064900027050010000002000",
        "000600000007020900009080120500040013004306200230070008043050800005090600000001000",
        "009400000807020560006850000100030020002000300030010008000063700021080605000002100",
        "500030000018500000700890010301000096005000400490000305030086007000003160000020009",
        "500030000018500000700890010301000096005000400490000305030086007000003160000020009",
        "500030000018500000700890010301000096005000400490000305030086007000003160000020009",
        "002000000000500640703004002080040706000300401006000000030480057020000100004120800",
        "000080400070106000006004001040000206200008050097030000800600009000090000001800703",
        "006090000080200010709004006020000704500007000001030000000800079050000360007300201",
        "003040000000600970509001004080090105100480000007000000030100840090000500005200003",
        "005080000090600520800705009024000106600008070009060000010200007070010050008500300",
        "005020300040800900906000005090050004800674090000090000520000067000010200009400500",
        "006080000070100250208000007050070803100538900000040000090320006020000090005800104",
        "004070000010200400900001085090000503200038070003090000060800700001040056002900040",
        "008010000000900050104000003020490701400720030000003000000500017050080200002300800",
        "000050000080000320002004001000060712800170400006000000010980070090400280008600004",
        "027010000140600070508032000010070608709100400002000030000450006080001000000800900",
        "001000500090000070503006002000030200000672040007010000100500024020090180005000300",
        "005080000040700000300009005070060901500901680006020000000130704000090000007800506",
        "000020800040800060005009002010040608600905000009070000200700006070000010008400209",
        "001030000000500040300004085080000501500060090007000006000600004076020000005108607",
        "300100000100590003020006195800600500090030080001005006283700050900058002000003008",
        "050200000003000050801570200230980700004000600008043029006092105010000900000007060",
        "090060000007000020516020400360500200009206300002001049005080913020000800000030060",
        "000040000001000030850900100700050600003806500006020001007009042010000900000080000",
        "010067000003000000784230100600000400001705900008000003006098247000000500000120090",
        "065200000008000000479000500500170900003804700007095008004000839000000600000003120",
        "070006000009000000605198700703020500500403007002080903006547209000000400000600050",
        "040980000002000090895060700010700400007603800008001070004020157070000200000017060",
        "096001000008000040500700900700430200003108700002075004009003006020000400000800390",
        "098027000000000090032810700300000200507000309006000004009048120060000000000260950",
        "070000000048000560100004700300090050001402900090030006003500001025000830000000070",
        "010000000028000590403200700600180000005706800000039007006004309032000670000000080",
        "090700000063000000201003900900600008008235400700004002009100706000000850000002010",
        "059000000002000050748900200900200000007395800000006001003004125070000400000000380",
        "080400000003000040246370800900030100001205400004080005005046781090000500000008030",
        "070900000008000090609208300420700008001309200800002015002504803040000100000001050",
        "015800000030000620607000300700900000004506200000004003001000802049000030000005410",
        "090600000000000080308420900900040705200935008401060009007094503040000000000002090",
        "005000000007000010800435600610540000500973008000068054009316005050000300000000400",
        "097630000006000000208000900670200000005090400000008016004000601000000700000041590",
        "002070001604002000070500000045300090000000007090104200000005076000603400200000050",
        "090530006801900000040000500070604000100000004020703089000000050000305208700090060",
        "052030000706209500090000010034600090600000001000708040000001023000006405000050060",
        "000090006849500200010200950057100000000000007000009830000002010900005340680000090",
        "000040009928600300000000280065100000100000003080007020000004030500706010630080040",
        "000080003078900640040000010012700000300000008080105030000004080000601720100090000",
        "070050001105600800060800090009400000600000004050006980000007030700300209390040050",
        "061050000200006400000300020075200030600000001000104600000007003300009005590020060",
        "003050000804100900050000780001803000600000008000705090000006019500000400240010070",
        "001040000003907240020000530005600080100000002090401070000003057300200800060010000",
        "024000000809005370000900810071500040000000000080403100000001085900208001710000060",
        "040700000006180200008000670001908000900000040007203081000305190100000003650090000",
        "000070000530000400091000270004907000200000003089305000000701300400800510020090080",
        "024090000031006080000100900006500030000000008200904700000001029100000063040200000",
        "900016000000000068020800005009700050370504016060003800600008020710000000000150003",
        "100050000080000070040603002070908320820000069093704010300802050050000030000010007",
        "100500000004060090000001074305800940000609000018002507840700000090080700000003006",
        "000300000000020319001906024405800602000239000208004103150403900746090000000005000",
        "000500400000020360000003092204300085000706000690002103480900000053010000007005000",
        "700400100000080305000003087004000701000154000605000800320800000506030000008001002",
        "010000030006030700023401960800000003000782000200000001032605180005070600080000040",
        "030502090009030700016807420900000004000703000800000007041908250002050300050304070",
        "060215070008603500073000120900040007000706000600030002015000690004109200090584030",
        "070040090009502400062000570600000005000603000200000009084000120007104600030020050",
        "000000000028564170060207030600409001805000304400802007080901050039675410000000000",
        "200070005000308000046000730805000304000050000407000906023000460000907000100040003",
        "009201600001976400070000080900010008017602540500040007090000030005328700004105800",
        "000000000002167400071209530700050002000731000400090007039405620004916700000000000",
        "070000020008309600030502080900010005020607040700080002040801090001906200090000030",
        "072601350009304800040000010700000009084000630500000007010000090007203100068509740",
        "071050840004918700080000030100020004000403000200080009050000090008294500019030270",
        "070406050008732900060509020700060002001000300200040008020305080004198200080604090",
        "300867004789000126000000000507030208000108000801070403000000000164000972900216005",
        "000000000005423800072809350590000068020060090140000035014902570009635400000000000",
        "050080010008000900030902050300070008000263000600050004090106040002000100070090080",
        "000010807501090000400800003300200000004080069000709200005020040200000000090006570",
        "900010000607090030000607100005400300000050046000801200008004070160000000070000062",
        "300060004000000730000200050705600000006000009000004800209081000130000000054003008",
        "600000001009205700500406002007103200900000006003809500300604009004308600200000007",
        "007030500008504700500000004060943050304060209050728060400000002003209600009070800",
        "087050310005204600000000000700485009003000400800361005000000000008109700019020850",
        "006821900005704200000000000509070102600000009204030507000000000001902700002613400",
        "059327180003608900000000000407030509030000060902070301000000000006504800014289670",
        "090503060008906300300000004010080030003000500080030020600000002007802900030109040",
        "069000480000802000800090005207000509600030004408000601900050008000609000053000290",
        "006000100007284500500000004109020603803501702204090805600000007008476200005000400",
        "009746300000903000300010009402030508703000104805090702900070005000204000007159200",
        "006208400007501600800000009700030006091000750600050004200000007009806300005904100",
        "008030600006528900500000001073010860800000007014090350300000006001652700009040500",
        "000000020040000809000089030308200400070950100000074000021003000039060040600005000",
        "000000041082000006000007800701290400090601000060075000070002030028740050400003000",
        "000100000258000030900085000807400900020900300000052001080003050002090070500007610",
        "400007001006403080078105000042000000000091000591040200000004098060000704100000320",
        "000032009098000001030900050006000000100053000800020543000006070005009602760008090",
        "200003006090001050000805200006000000000068000859072000003000091010000403400000520",
        "200061000050703000007402000021000000900030060684000250000005094000014802000000510",
        "500003000000609087000500030017400000000006020930050006000000018041030900090001700",
        "600000002050000040009163000005000000008047000004090781000008024070009508800005190",
        "000015007000004050009027000000300000507002090826050700000006074080040209700000180",
        "300069005002400000097305000086500000700040000401000630000004083000002506600000170",
        "700002004020008050006430090007000000001053000530040200000004085089000407400000620",
        "801000406000805000700961008106000704005679200208000905600254003000106000504000602",
        "004030700870000064200406008300187005000000000400952003600509001530000046009020800",
        "009020300000504000400908007702000901060702050305000402200801006000403000004050100",
        "008000100090020050100703008309000405700405009804000207400906003080040090003000800",
        "003040800940000012800000005400963008500207009700451003200000004380000051001090200",
        "001000300030010060000379000600721005980503041500894007000286000090030050008000100",
        "100908006060107090040206050009701200000000000004805300070409030090503060500602007",
        "500070008780000093039105270000492000000000000000617000072908460450000039300060001",
        "000030000002107060405000000001096080800005006304000010000904120000000000500670300",
        "000200700700903000408070009001050090000028400030000075000005100800400000070000380",
        "700000003000190270002050090028030000307009180604000020000375900000008000800940007",
        "000300000500708120600050030006080010003015800002000043000674000000000000100000780",
        "430500100900706000507030206005000080700000300300000061000002700000000002000170658",
        "000300000500708120600050030006080010003015800002000043000674000000000000100000780",
        "430500100900706000507030206005000080700000300300000061000002700000000002000170658",
        "000300000500708120600050030006080010003015800002000043000674000000000000100000780",
        "430500100900706000507030206005000080700000300300000061000002700000000002000170658",
        "000300000500708120600050030006080010003015800002000043000674000000000000100000780",
        "430500100900706000507030206005000080700000300300000061000002700000000002000170658",
        "000300000500708120600050030006080010003015800002000043000674000000000000100000780",
        "430500100900706000507030206005000080700000300300000061000002700000000002000170658",
        "000000070000700100007052038050003200003015000002960500020604001305000094004000780",
        "400008060000000700002560081006004008001000000200300690060005300105003046003400010",
        "009602300020000050080409070700020006100000005500090003010308060030000020007201400",
        "009701200700000006038509710206040107000000000904010802091206450800000009005803600",
        "020709080700010009000502000903020804010000020206080305000304000400050001060901040",
        "005000300030090020069803450300070004040020060800040005072104530010050040008000900",
        "002963700100070008090804020004000300030050090006000400020608050400020009005139800",
        "000978000700000005030000090406090803180000054307040102010000040800000009000169000",
        "007000100340000059000792000005906300720010096006803400000251000210000074009000200",
        "002000700700000003030794060004807900500000006009201500070635080900000005003000600",
        "070452080020090010000803000400000009390070051100000007000609000060030040010547060",
        "740000002020089000000200300106002080003000090002700600000876000000000064600005009",
        "402000003000074000030809000057000620900000050208900100000403006000006700500790008",
        "650000000070054080000000000028076030000005040009000000030107000006003059200000008",
        "100000400000050080000809502046008900000070050003400100400703000000001000602000003",
        "570000006080005040040300200814000090000010000005400700060501000009006172700009005",
        "540000000060010080090206500906001200000000010205400300000805000000000768800603004",
        "103000007060097000040200800002003080006000040401700200000578002000000150900100006",
        "920000608070090000040008005013000800005000040800900000000076000000002913000500006",
        "560000000040032080000006200310000840009000050784300000000490000000603019400801007",
        "070000608060070050080305007293001500006000020700200800000017000000003182000506000",
        "020000300070008090010209406385004160000000000402100800000807000000001624200405000",
        "100000009000045070090700200600090010001084020702000800080610000006000900500403008",
        "050000003000090010090405200035018700000007060708900300040309000003002104500700000",
        "908000600500103000000000012072030009009701400600050230760000000000907006004000705",
        "508290600000038000000000420003007004000301000200500300019000000000960000004013207",
        "058060200900004000730020040010000000009832100000000050020040071000200005004010380",
        "006309000000070802070004050100003006002090300700400008080200010205010000000507200",
        "310807200000015904000200080000002003400000009900700000070006000605120000001904068",
        "000702600200000501030690800100003009000000000700800004007025010902000007001408000",
        "000507300100000906000069580000008003600010007300600000015420000406000005008703000",
        "071908000400000000000651940000006005004090100600500000039284000000000004000705320",
        "060207000400093800050080700000006002030000010100400000001060030009750008000309040",
        "090000100600007504000904680000008005740000038800200000035806000906400007008000060",
        "090100006600034009050600420000008705000000000807500000064003010300250008700001090",
        "070208000100040203000901080000000008096000450200000000040503000605010002000807030",
        "000205000000001804070000360000002013400000006910800000097000030503700000000406000",
        "020700006000090307000805400000002089000080000680100000008901000401050000300004070",
        "500006000200015406060020390000003000050000080000600000084070060706590008000400003",
        "050401200400080709020060410000005000700000005000800000079010040504020008003604090",
        "800700500100080903020069470000006000030010080000800000094670030706040001008002006",
        "040003500700050109005901800000005004087000650400600000003708400804060002002300070",
        "900200400000050100000406080000009500680000031007800000030508000001020000009003006",
        "000600900600035004020970560900007000100000008000300007068013040700590003002004000",
        "530201000200030005001704200000003002340000016600500000003409600400080009000102043",
        "760403000400080000020596070100004002004000100500600008030849020000060007000305046",
        "030000900000063207080197300000009000910000078000200000006725040401380000008000020",
        "000007008700041502000098460000000103020000080807000000076450000309120004400700000",
        "380500000900064700010370200700005000000020000000800003003041080002950007000003059",
        "000205000000001804070000360000002013400000006910800000097000030503700000000406000",
        "020700006000090307000805400000002089000080000680100000008901000401050000300004070",
        "000000001200010470860000390609083000000109080000650000080002000706000200020008710",
        "070000803502000100090000075905360000000509000000087000000004090230000504050006020",
        "059000006208090000006000200067041000000639080000050000000007458120003007070000020",
        "010000000600040070097000500251060000000903010000250000000002900160009704720005030",
        "040000100102000000080020507958006000000080300000500000000002050270009806060004030",
        "080000704500020600040000293405009000000800060000470000000006000370000906620001040",
        "014060809200000070670000105006073000000106008000590000050004006008000902300000780",
        "062000109900000200800000654400060000000308000000450000030000005759000006020001730",
        "010000000900030270057000130004095000000401080000760000000003500300000609680000020",
        "048000700500000340000000281100274000000806000000519000080000006205000003430007050",
        "000000001200080300470000580009450000000801060000276000010007000098000200000000730",
        "006080405300070090190000602702006000000100084000830000060008007001000500800004160",
        "091000000308090100000040070703009000005200830000730000000012096800000004010004020",
        "050000003700040090041000200895000000000320050000050000000008300610002508080001040",
        "030010008700000900490000630105930000000006005000208000000001000600000407950003120",
        "054000008600000340300000250029070000005264000000190000000028009030001005800000710",
        "020070085900040063000000100409056000000408079000090000000003000700000002860002040",
        "850003000700400500024050000075340000080000070000018340000080120008004009000200054",
        "190002000400100090070050061352600010000000000040003572930010020010007009000300087",
        "340069000200700500079040080050600800000000000003001070020050640006007008000920057",
        "851049000300000050020010000185600030000000000040002987000020090010000003000580214",
        "090201070200000800010090000500706200000000000002908003000030090003000008060409050",
        "703048000000900140000020030081200960000000000097001480040030000068005000000410308",
        "690001000300700040010390050030087500000000000009240030080039070040002003000500064",
        "120008000604000270070060000230070140000000000016080095000040030048000507000500086",
        "300001007000300900010070030027100640000000000064008150070080060003009000800400001",
        "070001000500600320000030010007900250000000000046008700050020000093004001000300070",
        "360071020700000430000540000908000040000000000040000609000085000052000004030420081",
        "734002000105800240000030070610000430000000000087000052090080000073004806000900314",
        "740000000500310000002000610057104080900000001010206740095000200000069003000000098",
        "079206000500000007003070000050060070390000064040050090000020700400000008000901430",
        "314009000800000009006030001039740000060000020000082490600090200100000004000200816",
        "510706000000000009004090010038960000140000093000045780070010800800000000000608045",
        "560402000000700005007090080040019000056000140000840020030070800600003000000204013",
        "096305000200010000003090010080054000510000027000280040020040700000060008000507190",
        "020107005700060000005000007001890020240000083080042700400000900000010006800609040",
        "004507000800000001002040078045090000780000049000060830120070900400000006000903200",
        "080406000600700001000010063015000070807000104060000250250060000300004002000802010",
        "580602001600900000004010000013000040250000018060000730000020400000005007700804052",
        "267005000800620000003080002009051000600000004000970300400010500000049001000500248",
        "087003000900600005003080009050340000310000067000056080600030200100008006000400170",
        "870009000500100000001080037080620000106000203000041090250090800000008009000200065",
        "150003000000000008008010059087105000010000040000907280360020900800000000000500072",
        "040907000006100005000050087020510000090000020000083010730090000600001900000306050",
        "020050300005002000830001009000007840090040070072800000500400031000500900001060050",
        "050020100003000700810004200000002600040875030001900000005700062009000800004030010",
        "050400960000000000230059001000007609080000040301600000100540036000000000065001080",
        "050240703002900000090058002000000175000000000745000000600310050000004800201085040",
        "060500409000706000320090006000000921030050040184000000800030092000105000405002080",
        "040070601000300400750094800000000182000060000923000000007920048004008000209040010",
        "090870105004600900000040002000000213050060070821000000300050000002006500105089020",
        "060000843009000000150060007000006702090734010607800000900010078000000400571000060",
        "090730208004006000780040000000000174010000090345000000000050023000200600608019050",
        "000010802004000600360084070800001750000000000045700008070130025003000900108020000",
        "010680203000700000850020007000000108000504000705000000200060035000007000403058070",
        "000290608000005000740000105000000507070030040203000000608000014000600000305048000",
        "000380971000007300010060580600000740000000000094000006063020090009400000258096000",
        "000290608000005000740000105000000507070030040203000000608000014000600000305048000",
        "000380971000007300010060580600000740000000000094000006063020090009400000258096000",
        "000290608000005000740000105000000507070030040203000000608000014000600000305048000",
        "040302000002050000307900000005000009000040050890000106063001890009400005200700400",
        "000704000805030000092100000037000009040900020000040701700005430000027800008000010",
        "050609000706030000000000000010000006070560080080710002097000020005924007300000040",
        "080000000305000000769020000092700000000310400100042000620004590001005308008200740",
        "010400600006030000240500001100000000070100080960040103050000060002710305000209700",
        "050004000209050080004000000062400009097080060300002000905021470000098002006300090",
        "030000000401060030506070000054900000060000920900001000000005760000038005300100240",
        "040001000003040600209000010096800003031000020580403000000092380000156004000300200",
        "000809000009000000720400000058000007910730000400090108094007030002083700300910800",
        "070900000006050000325100000000000000439700050000820307200030570000090103603070900",
        "090100000005400100480600070000000000012800000700050981604030010000080502008900300",
        "080701000907000000120000000009000005310500000600020003891004030005080604004370910",
        "005076800060800000700009205010000000800020100207005408506031040000000900001004000",
        "301052800040000000607000300000009005400006700100840903702018500000000000000207001",
        "200013040010000080003009201000000000900000470806005309002074000790030000005006008",
        "509032860030000000200008000000091086900700000604500209400009150700800300000304008",
        "504062070060000000300009400000073004700916300603280907009038700200000000000401003",
        "903000572010000000500008400000000004000094800006050103609012700700000000300509000",
        "306004005040900000900007400080000047000031000109042008008000510000100900400509006",
        "500040203000900000006001509060000000700005800003098607302076400000000000807003000",
        "302005060080000000107003000000040036000709500806030907000051020600900300000306009",
        "504001090000000000309007400000080265000300900402000300006845000700100000000200008",
        "301000504000000000702005000000008109000050700007301802600217030000000400100806000",
        "000000280700450000003080605049000100300090004008000390401070500000032006035000000",
        "000000301600300500018005900027019000500020008000450190006700410002004007704000000",
        "000000054000200900204091007050010600700030009006070020500140703007008000180000000",
        "000000070600710300800035100010000200290060017005000040008970002003054009040000000",
        "000000008500200030004001209003002701805010602102600300207900800010007005600000000",
        "000000130000100500000073802078010960300020008041030250607850000009001000082000000",
        "000009000900720040406005800091000580000060000043000260004800301050073008000900000",
        "000009000900720040406005800091000580000060000043000260004800301050073008000900000",
        "000009000900720040406005800091000580000060000043000260004800301050073008000900000",
        "000009000900720040406005800091000580000060000043000260004800301050073008000900000",
        "010089000900020140000030000000000580275008000800091007060800390050600408000004050",
        "690057004500090370000300000009800000260009100400065009050020000020000091300008060",
        "900010005000050976000078004000600100371002000006030000040800200010000090295000007",
        "002043009000000536300051002000000300108005000703028004080500900010000040934002005",
        "060007000500020860000031000000300400056000700402000009070180290020000301000005070",
        "050031000800060137000080005000100400764005000200040003010400020070000908025006010",
        "040005000500020193000030042000000030084003000300098006050000600031600085078009020",
        "060059007300070500000040020000000760874006000500030009040300900007900032200004070",
        "640003000900050610000080005000700560058009000700030004090600230070800406004002080",
        "190007000500000240000030008000000476005002000300041000070300060080900700004200000",
        "830069000402300080050010000070000100604001000500078006000100240040000509000004070",
        "700089001000000890000160000008900600204005000300072009030200950060000400500001000",
        "704023008000010406800790000005000000367008000900037000020000150000000932430000080",
        "030095000100000094000010003000000620409006000300021000000200570060500901058000030",
        "476000000500060403100090000000200500017004000000089004090100200000000046030006095",
        "009000002000040013600570004001000700058003000000062008000400900090000060172008000",
        "870006001500080630000029008000100000057002000102045060060000300010003086708000010",
        "000000000003120850010058009020000100038005000009036000070600530080000420002000007",
        "000040105000001000800502600508000029000000000970000503001805004000600000204090000",
        "000001905800006031030400000207040010000010000010030704000004060120500008309200000",
        "700603008103050407000010000010205070009000500050809040000090000407030905500704002",
        "000901000208000705046000390020645080004802500080137020052000860409000103000309000",
        "000109000508407302071000960080905040000030000010806050036000490809601207000302000",
        "000908000004000700068050920030509070005020800080103050012060340009000500000801000",
        "000106000001308400039000810060000040008050700010000050087000930002405600000907000",
        "000807000708000109052030670060374080000000000070582010039020760806000403000603000",
        "000406000502108304080000070060801050008090400050702030040000090601903502000604000",
        "600803005704000806090040010060000080003415700050000030070060050106000203500701004",
        "000701000403000507027080930030809070000040000010206050041060890306000104000104000",
        "075409210010000040000271000039000720600000003084000190000352000040000060057906830",
        "031000950000070000000413000076205310040000070025907840000164000000050000017000520",
        "054000790030000040000417000295000478000020000716000253000964000070000020048000360",
        "006000400020010090000539000405301807072604310103702609000867000010020080008000900",
        "053000490040020030000804000400080009706000305200090001000406000080070060074000520",
        "054000910060000080000215000017030860000020000098060720000896000020000040081000590",
        "000201000070090080800407006059000860640000037028000140100508003090030010000904000",
        "000507000030080040800943007607000209002070800408000506500791002080020050000804000",
        "090406050000020000600090004470080026100000005920040071500060008000070000040108090",
        "068407920010000030000219000250806073007000600190302048000561000080000010021903750",
        "097604520010000080800751004001070200070000050004090600100845007040000030058307410",
        "060070800008300010100680005000013000003007601000900270800030060500000002342000500",
        "000269700000000020302400106000587009004002008080004603700040900400100000028000400",
        "020070600007320000900180007000002000000710843000050160600000010200000004815000700",
        "500040700000600050004700308000200000005080003240003970400090800800100000093400002",
        "900000800002030070003900005000500000005040020730001900000050190800400000090100002",
        "250090700000000030609800001002401000000600003960032400800006300300900002024300907",
        "300040700007320040000500803604950000102003058000002960000065070700000000030094006",
        "260098000009730000307020000000000006000470389900850040000000410400000003710900508",
        "780020900000000000609100004000203000002710003130049200200070400400900002095400807",
        "000080000003710020005900700000270000006003097200001640400020170500000000172400000",
        "302000007004000502060200080400050031825000479930070005050008090208000300100000708",
        "900060000005000604000800020800020910006409500019070002070001000503000200000090008",
        "800510000004000901300009000005700080001906300080003100000100007608000200000042006",
        "310040000007090308000700000700000053093804610540000009000009000409030100000060035",
        "260070009009000400000900050500091070700503008040620005070009000003000700800030062",
        "376010000005000301120000000000270068700408003810056000000000075403000100000020839",
        "436010000002000104000400000000069750060104080078320000000007000605000400000030618",
        "860010000004060900000300060000006029670902058940500000010003000008050100000070045",
        "002306100003951200090000070300000007600587002500000004040000030006814700007603400",
        "900702006600000009180000025009601500000050000004907300850000017700000003400105008",
        "200803004008000500010020060003705100500040008007201300080090050005000700100607009",
        "500304002000010000760020084600000007090561030200000001150080029000040000900602003",
        "004106300705030201030050060200000004851000732300000008010040070502080409003701500",
        "002705100500201006070000090207000605000102000603000208040000060100906004006804900",
        "000369000903804102060010040500000004016000250400000007020090030605102409000458000",
        "007501300005020900100060004900000007370000062600000003200070009001030200009208600",
        "000084010080700000002030900360000004008070200100000089006010400000002030070490000",
        "090020050067010000001009000920700830003040600048005027000800400000050210030070060",
        "090058040006007900000002306870040060004000700020090014407200000002300600080560020",
        "040038000009000003000005000680020740004070900075040086000900000200000400000350010",
        "800904003002678400400020006080090050027501960010060080700050008009836700100709005",
        "800602004002040100410000023050090040620000098070080050240000015001020400900401007",
        "000401000004070100120000034010050040098000760070060050760000093003040600000605000",
        "050409070001000300700010002207060904060070030504030107400090008008000500070108020",
        "010503040007000300063040510001020900070000060004030700036050470002000600090602030",
        "040802010007000200800060005008040600074506380005070100700010003003000800060307020",
        "700402001000795000408010209004050900010000040009070100902060708000327000500908002",
        "006000500000105000500623007360407058000000000940801023200378006000904000007000900",
        "089030610000704000403108705246000859000000000831000267305607401000803000028040370",
        "070060090000301000300000005810504032030000050450607089900000007000908000080050010",
        "080000050000602000400831009830109075920000041760504032100498006000703000040000090",
        "010204030028906450900000008800309004000010000400508009600000003085603740030705080",
        "050030010000401000200605008510803062000000000640107053800706001000304000030090070",
        "010030050029105730500907001800000006040000010200000004900708005074603890080020060",
        "001000400007903600600105008920000041050090080170000032400502007002604800005000300",
        "500020004000107000803050102028000430900000008067000250701060503000803000200010006",
        "380706042040802090200040007004261900000000000007483100500030001070108050910607034",
        "070060090000301000300000005810504032030000050450607089900000007000908000080050010",
        "080000050000602000400831009830109075920000041760504032100498006000703000040000090",
        "010204030028906450900000008800309004000010000400508009600000003085603740030705080",
        "050030010000401000200605008510803062000000000640107053800706001000304000030090070"
    ];
}(SUDOKU));
