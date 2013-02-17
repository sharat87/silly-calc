SHELL = /bin/bash

app.js: app.coffee
	coffee -c app.coffee

watch:
	@inotifywait -m -e close_write app.coffee | \
		while read line; do \
			$(MAKE) || notify-send 'coffee error'; \
		done
