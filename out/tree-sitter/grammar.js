module.exports = grammar({
	name: "mpu",
	extras: $ => [
		$._whitespace,
		$.comment,
		// $.comment_block,
		$.commentblock,
	],
	// externals: $ => [
	// 	$.comment_block,
	// ],
	// word: $ => $.identifier,

	rules: {
		source_file: $ => seq(
			repeat(
				seq(
					optional(
						choice(
							$._label,
							$.assembly,
							// alias(
							// 	$.comment_block,
							// 	'comment_block',
							// ),
							// $.comment,
						),
					),
					/\r?\n/,
				),
			),
			optional(
				choice(
					$._label,
					$.assembly,
					// $.comment_block,
					// $.comment,
				),
			),
		),

		assembly: $ => seq(
			repeat(
				seq(
					$.instruction,
					$.brackets,
				),
			),
			';',
			repeat(
				seq(
					$.instruction,
					$.brackets,
				),
			),
			';',
		),
		instruction: $ => choice(
			token(
				choice(
					'NOP',
					'RST',
					'ADD',
					'ADC',
					'SUB',
					'SBB',
					'MOV',
					'IMM',
					'INC',
					'DEC',
					'NEG',
					'LSH',
					'LSC',
					'LCF',
					'RCF',
					'NOR',
					'AND',
					'NOT',
					'FLG',
					'SETX',
					'SETY',
					'PRT',
					'VSH',
					'SPT',
					'RPT',
					'HLT',
					'JMP',
					'RET',
					'STL',
					'FFG',
					'CLR',
					'STR',
					'LOD',
					'OR',
					'NAND',
					'DSL',
					'CMP',
				),
			),
			alias(
				/[A-Z]{3,4}/,
				'ERROR',
			),
		),
		brackets: $ => seq(
			'(',
			commaSep($._operand),
			')',
		),
		_operand: $ => choice(
			$._label,
			$._macro,
			$._port,
			$.char,
			$._numeric,
			$._relative,
			$.register,
			$.identifier,
		),

		register: $ => /!?(CF|DS|R1[0-2]|R\d|RP|SR|SP|X|Y|ZF|ZR)|IN|NE|OD|RET|[A-Z]+/,
		identifier: $ => /[_a-zA-Z]\w*/,
		_macro: $ => betterErrorCorrection(seq('@', /[_a-zA-Z]+/, /\w*/), $.macro),
		_label: $ => betterErrorCorrection(seq('.', /[_a-zA-Z]+/, /\w*/), $.label),
		_port: $ => betterErrorCorrection(seq('%', /[_a-zA-Z]+/, /\w*/), $.port),
		_numeric: $ => betterErrorCorrection(
			choice(
				seq(
					'0',
					'x',
					/[0-9A-Fa-z]{1,2}/,
				),
				seq(
					'0b',
					/[01]{1,8}/,
				),
				/25[0-5]|2[0-4]\d|1?\d\d?/,
			),
			$.numeric,
		),
		_relative: $ => betterErrorCorrection(seq('~', /[+-]/, /\d+/), $.relative),
		// relative: $ => betterErrorCorrection(
		// 	seq(
		// 		alias(
		// 			'~',
		// 			'tilde',
		// 		),
		// 		alias(
		// 			/[+-]/,
		// 			'sign',
		// 		),
		// 		alias(
		// 			/\d+/,
		// 			'numeric',
		// 		),
		// 	),
		// 	$.relative,
		// ),
		// char: $ => betterErrorCorrection(seq("'", /[^'\r\n]/, "'"), $.char),
		// char: $ => betterErrorCorrection(seq("'", /\\[^\r\n]|[^'\r\n]/, "'"), $.char),
		// char: $ => /'([^'\r\n][^'\r\n();,]*)?'/,
		char: $ => alias(
			// token(
			seq(
				"'",
				// optional(
				/[^'\r\n][^'();,\/\s\r\n]?/,
				// /(\\[^\r\n]|[^'\r\n])[^'\s();,]*/,
				// ),
				"'",
			),
			'char',
		),

		comment: $ => /\/\/[^\r\n]*/,
		commentblock: $ => token.immediate(
			seq(
				'/*',
				/[^*]*/,
				/\*+/,
				/([^/*][^*]*\*+)*/,
				'/',
			),
		),

		// _whitespace: $ => /\s+/,
		_whitespace: $ => /[^\r\n[^\s]]+/,
		// _whitespace: $ => /[\t\f\v \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/,

		// error: $ => alias(/./, 'error'),
	},
});

function commaSep(rule) {
	return optional(
		seq(
			rule,
			repeat(
				seq(
					',',
					rule,
				),
			),
		),
	)
};

function betterErrorCorrection(rule, name) {
	if (name == null)
		return choice(
			token(
				rule,
			),
			rule,
		)
	else
		return alias(
			choice(
				token(
					rule,
				),

				rule,
			),
			name,
		)
};