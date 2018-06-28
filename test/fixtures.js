
exports.program1 =
  `# this is a comment, and this is line 1
  GOTO 3
  SET x 10
  PRINT x`



exports.count =
  `SET i 1
  SET max_iterations 5000000
  SET result 0

  # loop starts here
  INCRBY result 1

  # i++ (like a for loop)
  INCRBY i 1

  # i < max_iterations (for loop)
  LESS_THAN_OR_GOTO max_iterations i 5

  PRINT result
  `


