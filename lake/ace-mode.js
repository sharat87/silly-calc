ace.define('lake/ace-mode', function(require, exports, module) {

    var oop = require('ace/lib/oop'),
        TextMode = require('ace/mode/text').Mode,
        Tokenizer = require('ace/tokenizer').Tokenizer,
        TextHighlightRules =
            require('ace/mode/text_highlight_rules').TextHighlightRules;

    var LakeHighlightRules = function() {
        this.$rules = {
            start: [
                {token: 'constant.numeric', regex: /\d+/}
            ]
        };
    };
    oop.inherits(LakeHighlightRules, TextHighlightRules);

    var Mode = function() {
        this.$tokenizer = new Tokenizer(new LakeHighlightRules().getRules());
    };
    oop.inherits(Mode, TextMode);

    (function() {
        // Extra logic goes here. (see below)
    }).call(Mode.prototype);

    exports.Mode = Mode;
});
