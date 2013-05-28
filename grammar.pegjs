{
  var self = this;

  function getVar(name) {
    return self.scope.hasOwnProperty(name) ?
              self.scope[name] : 0;
  }

  function setVar(name, value) {
    return self.scope[name] = value;
  }

  function wrap(result) {
    return {ok: true, hasValue: typeof result == 'number', value: result};
  }
}

start = exprLine

// The order of the first two entries is awkward, but necessary for sensible
// error messages to be generated.
exprLine
  = [^\n:]* ':'
    { self.headerRow = self.row;
      return wrap(''); }
  / expr:expr ('#' [^\n]*)?
    { return wrap(expr); }
  / ('#' .*)?
    { return wrap(''); }

expr
  = result:(assignment / addition) __
    { return result; }

assignment
  = name:identifier __ '=' __ value:expr
    { return setVar(name, value); }

addition
  = left:subtraction __ '+' __ right:addition
    { return left + right; }
  / subtraction

subtraction
  = result:multiplication tail:(__ '-' __ multiplication)*
    { for (var i = 0; i < tail.length;)
        result = result - tail[i++][3];
      return result; }
  / multiplication

multiplication
  = left:division __ '*' __ right:multiplication
    { return left * right; }
  / division

division
  = result:exponentiation tail:(__ '/' __ exponentiation)*
    { for (var i = 0; i < tail.length;)
        result = result / tail[i++][3];
      return result; }
  / exponentiation

exponentiation
  = left:unary __ '^' __ right:exponentiation
    { return Math.pow(left, right); }
  / unary

unary
  = '-' n:number
    { return -n; }
  / '+' n:number
    { return n; }
  / atom

atom
  = functionCall
  / '(' expr:expr ')'?
    { return expr; }
  / percentage
  / number
  / lineRef
  / name:identifier
    { return getVar(name); }

// Functions cannot not take any arguments. Currently.
// TODO: Error checking.
functionCall
  = name:identifier '(' arg1:expr rest:(';' expr)* ')'
    { var args = [arg1];
      for (var i = 0; i < rest.length; i++)
        args.push(rest[i][1]);
      return getVar(name).apply(null, args); }

percentage
  = num:(float / integer) '%'
    { return num / 100; }

number "a number"
  = float
  / hexNumber
  / octNumber
  / integer

float
  = integral:[0-9]* '.' fractional:[0-9]+
    { return parseFloat(integral.join('') + '.' + fractional.join('')); }

integer
  = digits:[0-9]+
    { return parseInt(digits.join(''), 10); }

hexNumber
  = '0x' digits:[0-9A-F]+
    { return parseInt(digits.join(''), 16); }

octNumber
  = '0o' digits:[0-7]+
    { return parseInt(digits.join(''), 8); }

identifier "an identifier"
  = head:[a-zA-Z] tail:[a-zA-Z0-9_]*
    { return head + tail.join(''); }

lineRef "a line reference"
  = '_' ds:[0-9]+
    { var refNo = parseInt(ds.join(''), 10),
          result = self.results[self.row - refNo];
      return result.hasValue ? result.value : ''; }

__ "whitespace"
  = (' ' / '\t')*

// vim: se ai sw=2 sts=2 :
