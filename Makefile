.PHONY: all

all: grammar.js

grammar.js: grammar.pegjs
	pegjs --track-line-and-column -e LangParser grammar.pegjs

watch: all
	echo grammar.pegjs | entr make all
