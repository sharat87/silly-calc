{
  // `this` is the same as `Lang.parser`.
  var self = this;
  self.scope = self.scope || {
    PI: Math.PI,
    sqrt: Math.sqrt,
    log: Math.log,
    sin: Math.sin,
    cos: Math.cos
  };
}

start = langScript

langScript
  = init:(exprLine '\n'+)* last:exprLine '\n'*
    { var results = [last];
      for (var i = init.length; i-- > 0;)
        results.unshift(init[i][0]);
      return results; }
  / ''

exprLine
  = expr:expr (';' .*)?
    { return expr; }
  / (';' .*)?
    { return ''; }
  / { return 'err'; }

expr
  = result:assignment __
    { return result; }
  / result:addition __
    { return result; }

assignment
  = name:identifier __ '=' __ value:expr
    { self.scope[name] = value; return value; }

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
  / number
  / name:identifier
    { return self.scope[name]; }

// Functions cannot not take any arguments. Currently.
// TODO: Error checking.
functionCall
  = name:identifier '(' arg1:expr rest:(',' expr)* ')'
    { var args = [arg1];
      for (var i = 0; i < rest.length; i++)
        args.push(rest[i][1]);
      return self.scope[name].apply(self.scope, args); }

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
  = head:[a-zA-Z_] tail:[a-zA-Z0-9_]*
    { return head + tail.join(''); }

__ "whitespace"
  = (' ' / '\t')*

// vim: se ai sw=2 sts=2 :
