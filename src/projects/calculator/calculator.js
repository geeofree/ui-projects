const isDigit = /\d/;

function main() {
  const screen = document.getElementById('calculator-screen');
  const buttons = document.querySelectorAll('#calculator-button');

  let input = [];
  let hasDecimalAlready = false;

  buttons.forEach((button) => {
    button.onclick = (event) => {
      const thisButton = event.target;
      const buttonId = thisButton.dataset.id;
      const buttonValue = thisButton.dataset.value;

      switch (buttonId) {
        case "cancel":
          hasDecimalAlready = false;
          input = [];
          break;
        case "delete": {
          const copy = input.slice();
          const [lastItem] = copy.splice(-1);

          if (lastItem === '.') {
            hasDecimalAlready = false;
          }

          input = copy;
          break;
        }
        case "equals":
          if (!input.length) {
            break
          }
          try {
            const tokens = tokenize(input);
            const ast = parse(tokens);
            input = [interpret(ast)];
          } catch (error) {
            console.error(error);
          }
          break;
        case "dot":
          if (!hasDecimalAlready) {
            hasDecimalAlready = true;
            const copy = input.slice();
            const [lastItem] = copy.splice(-1);

            if (!isDigit.test(lastItem)) {
              input = [...copy, lastItem ?? '', '0' + buttonValue];
            } else {
              input = [...copy, lastItem, buttonValue];
            }
          }
          break
        case "add":
        case "subtract":
        case "multiply":
        case "divide":
          hasDecimalAlready = false;
          input = [...input, buttonValue]
          break
        default:
          input = [...input, buttonValue];
          break;
      }

      screen.textContent = input.join('')
    }
  });
}

const TOKEN_TYPES = {
  L_PAREN: 'L_PAREN',
  R_PAREN: 'R_PAREN',
  ADD: 'ADD',
  SUB: 'SUB',
  MUL: 'MUL',
  DIV: 'DIV',
  NUMBER: 'NUMBER',
}

function tokenize(chars) {
  const tokens = [];

  for (let i = 0; i < chars.length; i++) {
    let char = chars[i];

    switch (char) {
      case "(":
        tokens.push(createToken(TOKEN_TYPES.L_PAREN, char));
        continue;
      case ")":
        tokens.push(createToken(TOKEN_TYPES.R_PAREN, char));
        continue;
      case "+":
        tokens.push(createToken(TOKEN_TYPES.ADD, char));
        continue;
      case "-":
        tokens.push(createToken(TOKEN_TYPES.SUB, char));
        continue;
      case "*":
        tokens.push(createToken(TOKEN_TYPES.MUL, char));
        continue;
      case "/":
        tokens.push(createToken(TOKEN_TYPES.DIV, char));
        continue;
      default:
        if (isDigit.test(char)) {
          let digits = '';
          while ((isDigit.test(char) || char === '.') && i < chars.length) {
            digits += char;
            char = chars[++i];
          } 
          tokens.push(createToken(TOKEN_TYPES.NUMBER, digits));
          i--;
          continue;
        }
        console.error('invalid character:', char);
        continue;
    }
  }

  return tokens;
}

function createToken(tokenType, tokenValue) {
  return { type: tokenType, value: tokenValue }
}

const EXPR_TYPES = {
  BINARY: 'BINARY',
  NUMBER: 'NUMBER',
  GROUPING: 'GROUPING'
}

function parse(tokens) {
  const ast = [];
  let head = 0;

  while (!isAtEnd()) {
    ast.push(expression());
  }

  function expression() {
    return parenthesis();
  }

  function parenthesis() {
    if (matchesToken(TOKEN_TYPES.L_PAREN)) {
      const expr = expression();
      if (consumeToken(TOKEN_TYPES.R_PAREN) === null) throw new Error('Expected ")" after expression');
      return createGroupingExpr(expr);
    }

    return factor();
  }

  function factor() {
    let expr = sum();

    while (matchesToken(TOKEN_TYPES.ADD, TOKEN_TYPES.SUB)) {
      const operator = previousToken();
      const right = sum();
      expr = createBinaryExpr(expr, operator, right);
    }

    return expr
  }

  function sum() {
    let expr = digit();

    while (matchesToken(TOKEN_TYPES.MUL, TOKEN_TYPES.DIV)) {
      const operator = previousToken();
      const right = digit();
      expr = createBinaryExpr(expr, operator, right);
    }

    return expr
  }

  function digit() {
    if (matchesToken(TOKEN_TYPES.L_PAREN)) {
      const expr = expression();
      if (consumeToken(TOKEN_TYPES.R_PAREN) === null) throw new Error('Expected ")" after expression');
      return createGroupingExpr(expr);
    }

    if (matchesToken(TOKEN_TYPES.NUMBER)) {
      const left = previousToken();

      if (matchesToken(TOKEN_TYPES.L_PAREN)) {
        const right = expression();
        if (consumeToken(TOKEN_TYPES.R_PAREN) === null) throw new Error('Expected ")" after expression');
        return createBinaryExpr(left, createToken(TOKEN_TYPES.MUL, '*'), right);
      }

      return createNumberExpr(left);
    }

    throw new Error('Invalid expression.');
  }

  function createBinaryExpr(left, operator, right) {
    return { type: EXPR_TYPES.BINARY, left, operator, right }
  }

  function createNumberExpr(token) {
    return { type: EXPR_TYPES.NUMBER, value: token.value }
  }

  function createGroupingExpr(expr) {
    return { type: EXPR_TYPES.GROUPING, expr }
  }

  function matchesToken(...tokenTypes) {
    if (!isAtEnd() && tokenTypes.includes(currentToken().type)) {
      getNextToken();
      return true;
    }
    return false;
  }

  function currentToken() {
    return tokens[head];
  }

  function previousToken() {
    return tokens[head - 1];
  }

  function consumeToken(tokenType) {
    if (!isAtEnd() && currentToken().type === tokenType) {
      getNextToken();
      return previousToken();
    }

    return null;
  }

  function getNextToken() {
    if (!isAtEnd()) {
      head += 1;
    }
    return tokens[head];
  }

  function isAtEnd() {
    return head >= tokens.length;
  }

  return ast;
}

function interpret(ast) {
  let head = 0;
  let value = 1;

  while (!isAtEnd()) {
    value *= calculateGrouping(currentNode())
    head += 1;
  }

  function calculateBinary(expr) {
    const left = calculateGrouping(expr.left);
    const right = calculateGrouping(expr.right);

    switch (expr.operator.type) {
      case TOKEN_TYPES.ADD:
        return left + right;
      case TOKEN_TYPES.SUB:
        return left - right;
      case TOKEN_TYPES.MUL:
        return left * right;
      case TOKEN_TYPES.DIV:
        return left / right;
    }
  }

  function calculateGrouping(expr) {
    if (expr.type === EXPR_TYPES.GROUPING) {
      return calculateGrouping(expr.expr)
    }

    if (expr.type === EXPR_TYPES.BINARY) {
      return calculateBinary(expr)
    }

    if (expr.type === EXPR_TYPES.NUMBER) {
      return Number(expr.value)
    }

    throw new Error('invalid expression');
  }

  function currentNode() {
    return ast[head]
  }

  function isAtEnd() {
    return head >= ast.length;
  }

  return value;
}

main();
