codeInput = document.getElementById 'code-input'
resultsPanel = document.getElementById 'results-panel'
gutter = document.getElementById 'gutter'

updateSheet = ->
  lines = codeInput.value.split '\n'
  evaluator = new TapDigit.Evaluator()
  resultHtmls = []
  gutterHtmls = []

  for line, i in lines
    varname = 'L' + (i + 1)
    code = varname + ' = ' + line
    result = if line then evaluator.evaluate(code) else '-'

    resultHtmls.splice(resultHtmls.length, 0,
      '<div class=result data-label="', varname, ': ">', result, '</div>')

    gutterHtmls.splice gutterHtmls.length, 0, '<div>', varname, ': ', '</div>'

  resultsPanel.innerHTML = resultHtmls.join('')
  gutter.innerHTML = gutterHtmls.join('')

codeInput.addEventListener 'keydown', -> setTimeout updateSheet, 0
codeInput.addEventListener 'change', updateSheet

codeInput.value = [
  'a = 2'
  'a'
  'sin(pi/4) * sqrt(a) + 42'
  'L3'
].join('\n')

do updateSheet
