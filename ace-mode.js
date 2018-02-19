/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

const FoldMode = (function () {
    const oop = ace.require('ace/lib/oop'),
        BaseFoldMode = ace.require('ace/mode/folding/fold_mode').FoldMode,
        Range = ace.require('ace/range').Range;

    const FoldMode = function () {
    };
    oop.inherits(FoldMode, BaseFoldMode);

    FoldMode.prototype.foldingStartMarker = /:$/;

    FoldMode.prototype.getFoldWidgetRange = function (session, foldStyle, row) {
        let match = session.getLine(row).match(this.foldingStartMarker);
        if (!match) return null;

        const startRow = row;
        let endRow = row;
        const maxRow = session.getLength();

        while (++row < maxRow) {
            const line = session.getLine(row);
            if (line.match(this.foldingStartMarker)) break;
            if (line) endRow = row;
        }

        if (endRow > startRow)
            return new Range(startRow, match.index + 1,
                endRow, session.getLine(endRow).length);
    };

    return FoldMode;
}());

const Completer = {
    getCompletions: function (state, session, pos, prefix) {
        console.log('getCompletions', state, session, pos, prefix);
    }
};

ace.define('lang/ace-mode-js', function (require, exports, module) {

    const oop = require('ace/lib/oop'),
        TextMode = require('ace/mode/text').Mode,
        Tokenizer = require('ace/tokenizer').Tokenizer,
        LakeHighlightRules = require('lake/highlight-rules').LakeHighlightRules,
        Range = require('ace/range').Range,
        WorkerClient = require('ace/worker/worker_client').WorkerClient,
        CstyleBehaviour = require('ace/mode/behaviour/cstyle').CstyleBehaviour;

    const Mode = function () {
        this.$tokenizer = new Tokenizer(new LakeHighlightRules().getRules());
        this.$behaviour = new CstyleBehaviour();
        this.foldingRules = new FoldMode();
    };
    oop.inherits(Mode, TextMode);

    Object.assign(Mode.prototype, {

        // TODO: What the hell is this for?
        lineCommentStart: '#',

        // TODO: Use the lake parser here.
        // this.createWorker = function(session) {
        //     var worker = new WorkerClient(["ace"], "ace/mode/javascript_worker", "JavaScriptWorker");
        //     worker.attachToDocument(session.getDocument());

        //     worker.on("jslint", function(results) {
        //         session.setAnnotations(results.data);
        //     });

        //     worker.on("terminate", function() {
        //         session.clearAnnotations();
        //     });

        //     return worker;
        // };

    });

    exports.Mode = Mode;
});


ace.define('lake/highlight-rules', function (require, exports, module) {

    const oop = require('ace/lib/oop');
    const TextHighlightRules = require('ace/mode/text_highlight_rules').TextHighlightRules;

    const LakeHighlightRules = function () {

        this.$rules = {
            start: [
                {token: 'comment.block.documentation', regex: /[^\n:]+\:/},
                {token: 'variable', regex: /[a-zA-Z][a-zA-Z0-9_]*/},
                {token: 'keyword.operator', regex: /[=\-\+\*\/\^%]+/},
                {token: 'lineref.keyword.other', regex: /_\d+/},
                {token: 'constant.numeric', regex: /\d+(\.\d+)?/},
                {token: 'comment.line.semicolon', regex: /#.*$/}
            ]
        };

    };

    oop.inherits(LakeHighlightRules, TextHighlightRules);

    exports.LakeHighlightRules = LakeHighlightRules;
});


ace.define('ace/mode/behaviour/cstyle', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/behaviour', 'ace/token_iterator', 'ace/lib/lang'], function (require, exports, module) {

    const oop = require("../../lib/oop");
    const Behaviour = require("../behaviour").Behaviour;
    const TokenIterator = require("../../token_iterator").TokenIterator;
    const lang = require("../../lib/lang");

    const SAFE_INSERT_IN_TOKENS =
        ["text", "paren.rparen", "punctuation.operator"];
    const SAFE_INSERT_BEFORE_TOKENS =
        ["text", "paren.rparen", "punctuation.operator", "comment"];

    let autoInsertedBrackets = 0;
    let autoInsertedRow = -1;
    let autoInsertedLineEnd = "";
    let maybeInsertedBrackets = 0;
    let maybeInsertedRow = -1;
    let maybeInsertedLineStart = "";
    let maybeInsertedLineEnd = "";

    const CstyleBehaviour = function () {

        CstyleBehaviour.isSaneInsertion = function (editor, session) {
            const cursor = editor.getCursorPosition();
            const iterator = new TokenIterator(session, cursor.row, cursor.column);
            if (!this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS)) {
                const iterator2 = new TokenIterator(session, cursor.row, cursor.column + 1);
                if (!this.$matchTokenType(iterator2.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS))
                    return false;
            }
            iterator.stepForward();
            return iterator.getCurrentTokenRow() !== cursor.row ||
                this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_BEFORE_TOKENS);
        };

        CstyleBehaviour.$matchTokenType = function (token, types) {
            return types.indexOf(token.type || token) > -1;
        };

        CstyleBehaviour.recordAutoInsert = function (editor, session, bracket) {
            const cursor = editor.getCursorPosition();
            const line = session.doc.getLine(cursor.row);
            if (!this.isAutoInsertedClosing(cursor, line, autoInsertedLineEnd[0]))
                autoInsertedBrackets = 0;
            autoInsertedRow = cursor.row;
            autoInsertedLineEnd = bracket + line.substr(cursor.column);
            autoInsertedBrackets++;
        };

        CstyleBehaviour.recordMaybeInsert = function (editor, session, bracket) {
            const cursor = editor.getCursorPosition();
            const line = session.doc.getLine(cursor.row);
            if (!this.isMaybeInsertedClosing(cursor, line))
                maybeInsertedBrackets = 0;
            maybeInsertedRow = cursor.row;
            maybeInsertedLineStart = line.substr(0, cursor.column) + bracket;
            maybeInsertedLineEnd = line.substr(cursor.column);
            maybeInsertedBrackets++;
        };

        CstyleBehaviour.isAutoInsertedClosing = function (cursor, line, bracket) {
            return autoInsertedBrackets > 0 &&
                cursor.row === autoInsertedRow &&
                bracket === autoInsertedLineEnd[0] &&
                line.substr(cursor.column) === autoInsertedLineEnd;
        };

        CstyleBehaviour.isMaybeInsertedClosing = function (cursor, line) {
            return maybeInsertedBrackets > 0 &&
                cursor.row === maybeInsertedRow &&
                line.substr(cursor.column) === maybeInsertedLineEnd &&
                line.substr(0, cursor.column) == maybeInsertedLineStart;
        };

        CstyleBehaviour.popAutoInsertedClosing = function () {
            autoInsertedLineEnd = autoInsertedLineEnd.substr(1);
            autoInsertedBrackets--;
        };

        CstyleBehaviour.clearMaybeInsertedClosing = function () {
            maybeInsertedBrackets = 0;
            maybeInsertedRow = -1;
        };

        this.add("braces", "insertion", function (state, action, editor, session, text) {
            const cursor = editor.getCursorPosition();
            const line = session.doc.getLine(cursor.row);
            if (text == '{') {
                const selection = editor.getSelectionRange();
                const selected = session.doc.getTextRange(selection);
                if (selected !== "" && selected !== "{" && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: '{' + selected + '}',
                        selection: false
                    };
                } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                    if (/[\]\}\)]/.test(line[cursor.column])) {
                        CstyleBehaviour.recordAutoInsert(editor, session, "}");
                        return {
                            text: '{}',
                            selection: [1, 1]
                        };
                    } else {
                        CstyleBehaviour.recordMaybeInsert(editor, session, "{");
                        return {
                            text: '{',
                            selection: [1, 1]
                        };
                    }
                }
            } else if (text == '}') {
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == '}') {
                    const matching = session.$findOpeningBracket('}', {column: cursor.column + 1, row: cursor.row});
                    if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                        CstyleBehaviour.popAutoInsertedClosing();
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            } else if (text == "\n" || text == "\r\n") {
                let closing = "";
                if (CstyleBehaviour.isMaybeInsertedClosing(cursor, line)) {
                    closing = lang.stringRepeat("}", maybeInsertedBrackets);
                    CstyleBehaviour.clearMaybeInsertedClosing();
                }
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == '}' || closing !== "") {
                    let openBracePos = session.findMatchingBracket({row: cursor.row, column: cursor.column}, '}');
                    if (!openBracePos)
                        return null;

                    const indent = this.getNextLineIndent(state, line.substring(0, cursor.column), session.getTabString());
                    const next_indent = this.$getIndent(line);

                    return {
                        text: '\n' + indent + '\n' + next_indent + closing,
                        selection: [1, indent.length, 1, indent.length]
                    };
                }
            }
        });

        this.add("braces", "deletion", function (state, action, editor, session, range) {
            const selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && selected == '{') {
                const line = session.doc.getLine(range.start.row);
                const rightChar = line.substring(range.end.column, range.end.column + 1);
                if (rightChar == '}') {
                    range.end.column++;
                    return range;
                } else {
                    maybeInsertedBrackets--;
                }
            }
        });

        this.add("parens", "insertion", function (state, action, editor, session, text) {
            if (text == '(') {
                const selection = editor.getSelectionRange();
                const selected = session.doc.getTextRange(selection);
                if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: '(' + selected + ')',
                        selection: false
                    };
                } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                    CstyleBehaviour.recordAutoInsert(editor, session, ")");
                    return {
                        text: '()',
                        selection: [1, 1]
                    };
                }
            } else if (text == ')') {
                const cursor = editor.getCursorPosition();
                const line = session.doc.getLine(cursor.row);
                const rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == ')') {
                    const matching = session.$findOpeningBracket(')', {column: cursor.column + 1, row: cursor.row});
                    if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                        CstyleBehaviour.popAutoInsertedClosing();
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            }
        });

        this.add("parens", "deletion", function (state, action, editor, session, range) {
            const selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && selected == '(') {
                const line = session.doc.getLine(range.start.row);
                const rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                if (rightChar == ')') {
                    range.end.column++;
                    return range;
                }
            }
        });

        this.add("brackets", "insertion", function (state, action, editor, session, text) {
            if (text == '[') {
                const selection = editor.getSelectionRange();
                const selected = session.doc.getTextRange(selection);
                if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: '[' + selected + ']',
                        selection: false
                    };
                } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                    CstyleBehaviour.recordAutoInsert(editor, session, "]");
                    return {
                        text: '[]',
                        selection: [1, 1]
                    };
                }
            } else if (text == ']') {
                const cursor = editor.getCursorPosition();
                const line = session.doc.getLine(cursor.row);
                const rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == ']') {
                    const matching = session.$findOpeningBracket(']', {column: cursor.column + 1, row: cursor.row});
                    if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                        CstyleBehaviour.popAutoInsertedClosing();
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            }
        });

        this.add("brackets", "deletion", function (state, action, editor, session, range) {
            const selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && selected == '[') {
                const line = session.doc.getLine(range.start.row);
                const rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                if (rightChar == ']') {
                    range.end.column++;
                    return range;
                }
            }
        });

        this.add("string_dquotes", "insertion", function (state, action, editor, session, text) {
            if (text == '"' || text == "'") {
                const quote = text;
                const selection = editor.getSelectionRange();
                const selected = session.doc.getTextRange(selection);
                if (selected !== "" && selected !== "'" && selected != '"' && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: quote + selected + quote,
                        selection: false
                    };
                } else {
                    const cursor = editor.getCursorPosition();
                    const line = session.doc.getLine(cursor.row);
                    const leftChar = line.substring(cursor.column - 1, cursor.column);
                    if (leftChar == '\\') {
                        return null;
                    }
                    const tokens = session.getTokens(selection.start.row);
                    let col = 0, token;
                    let quotepos = -1; // Track whether we're inside an open quote.

                    for (let x = 0; x < tokens.length; x++) {
                        token = tokens[x];
                        if (token.type == "string") {
                            quotepos = -1;
                        } else if (quotepos < 0) {
                            quotepos = token.value.indexOf(quote);
                        }
                        if ((token.value.length + col) > selection.start.column) {
                            break;
                        }
                        col += tokens[x].value.length;
                    }
                    if (!token || (quotepos < 0 && token.type !== "comment" && (token.type !== "string" || ((selection.start.column !== token.value.length + col - 1) && token.value.lastIndexOf(quote) === token.value.length - 1)))) {
                        if (!CstyleBehaviour.isSaneInsertion(editor, session))
                            return;
                        return {
                            text: quote + quote,
                            selection: [1, 1]
                        };
                    } else if (token && token.type === "string") {
                        const rightChar = line.substring(cursor.column, cursor.column + 1);
                        if (rightChar == quote) {
                            return {
                                text: '',
                                selection: [1, 1]
                            };
                        }
                    }
                }
            }
        });

        this.add("string_dquotes", "deletion", function (state, action, editor, session, range) {
            const selected = session.doc.getTextRange(range);
            if (!range.isMultiLine() && (selected == '"' || selected == "'")) {
                const line = session.doc.getLine(range.start.row);
                const rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                if (rightChar == selected) {
                    range.end.column++;
                    return range;
                }
            }
        });

    };

    oop.inherits(CstyleBehaviour, Behaviour);

    exports.CstyleBehaviour = CstyleBehaviour;
});
