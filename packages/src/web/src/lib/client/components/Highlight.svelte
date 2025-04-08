<script lang="ts">
	import highlightjs from 'highlight.js/lib/core';
	import xml from 'highlight.js/lib/languages/xml';
	import bash from 'highlight.js/lib/languages/bash';
	import javascript from 'highlight.js/lib/languages/javascript';

	// Then register the languages you need
	highlightjs.registerLanguage('xml', xml);
	highlightjs.registerLanguage('bash', bash);
	highlightjs.registerLanguage('javascript', javascript);

	let { language, text } = $props<{ language: 'xml' | 'bash' | 'javascript'; text: string }>();

	let highlight = highlightjs.highlight(text, { language }).value;
</script>

<pre class="dark"><code class="hljs">{@html highlight}</code></pre>

<style>
	:global {
		pre code.hljs {
			display: block;
			overflow-x: auto;
			padding: 8px 16px;
		}
        
		code.hljs {
			padding: 4px 8px;
		}

		.dark {
			.hljs {
				/* var(--highlight-color) */
				color: #ffffff;
				/* var(--highlight-bg) */
				background: #1c1b1b;
			}
			.hljs-subst {
				/* var(--highlight-color) */
				color: #ffffff;
			}
			.hljs-comment {
				/* var(--highlight-comment) */
				color: #999999;
			}
			.hljs-keyword,
			.hljs-selector-tag,
			.hljs-meta .hljs-keyword,
			.hljs-doctag,
			.hljs-section {
				/* var(--highlight-keyword) */
				color: #88aece;
			}
			.hljs-attr {
				/* var(--highlight-attribute); */
				color: #88aece;
			}
			.hljs-attribute {
				/* var(--highlight-symbol) */
				color: #c59bc1;
			}
			.hljs-name,
			.hljs-type,
			.hljs-number,
			.hljs-selector-id,
			.hljs-quote,
			.hljs-template-tag {
				/* var(--highlight-namespace) */
				color: #f08d49;
			}
			.hljs-selector-class {
				/* var(--highlight-keyword) */
				color: #88aece;
			}
			.hljs-string,
			.hljs-regexp,
			.hljs-symbol,
			.hljs-variable,
			.hljs-template-variable,
			.hljs-link,
			.hljs-selector-attr {
				/* var(--highlight-variable) */
				color: #b5bd68;
			}
			.hljs-meta,
			.hljs-selector-pseudo {
				/* var(--highlight-keyword) */
				color: #88aece;
			}
			.hljs-built_in,
			.hljs-title,
			.hljs-literal {
				/* var(--highlight-literal) */
				color: #f08d49;
			}
			.hljs-bullet,
			.hljs-code {
				/* var(--highlight-punctuation) */
				color: #cccccc;
			}
			.hljs-meta .hljs-string {
				/* var(--highlight-variable) */
				color: #b5bd68;
			}
			.hljs-deletion {
				/* var(--highlight-deletion) */
				color: #de7176;
			}
			.hljs-addition {
				/* var(--highlight-addition) */
				color: #76c490;
			}
			.hljs-emphasis {
				font-style: italic;
			}
			.hljs-strong {
				font-weight: bold;
			}
		}

		.light {
			.hljs {
				/* var(--highlight-color) */
				color: #2f3337;
				/* var(--highlight-bg) */
				background: #f6f6f6;
			}
			.hljs-subst {
				/* var(--highlight-color) */
				color: #2f3337;
			}
			.hljs-comment {
				/* var(--highlight-comment) */
				color: #656e77;
			}
			.hljs-keyword,
			.hljs-selector-tag,
			.hljs-meta .hljs-keyword,
			.hljs-doctag,
			.hljs-section {
				/* var(--highlight-keyword) */
				color: #015692;
			}
			.hljs-attr {
				/* var(--highlight-attribute); */
				color: #015692;
			}
			.hljs-attribute {
				/* var(--highlight-symbol) */
				color: #803378;
			}
			.hljs-name,
			.hljs-type,
			.hljs-number,
			.hljs-selector-id,
			.hljs-quote,
			.hljs-template-tag {
				/* var(--highlight-namespace) */
				color: #b75501;
			}
			.hljs-selector-class {
				/* var(--highlight-keyword) */
				color: #015692;
			}
			.hljs-string,
			.hljs-regexp,
			.hljs-symbol,
			.hljs-variable,
			.hljs-template-variable,
			.hljs-link,
			.hljs-selector-attr {
				/* var(--highlight-variable) */
				color: #54790d;
			}
			.hljs-meta,
			.hljs-selector-pseudo {
				/* var(--highlight-keyword) */
				color: #015692;
			}
			.hljs-built_in,
			.hljs-title,
			.hljs-literal {
				/* var(--highlight-literal) */
				color: #b75501;
			}
			.hljs-bullet,
			.hljs-code {
				/* var(--highlight-punctuation) */
				color: #535a60;
			}
			.hljs-meta .hljs-string {
				/* var(--highlight-variable) */
				color: #54790d;
			}
			.hljs-deletion {
				/* var(--highlight-deletion) */
				color: #c02d2e;
			}
			.hljs-addition {
				/* var(--highlight-addition) */
				color: #2f6f44;
			}
			.hljs-emphasis {
				font-style: italic;
			}
			.hljs-strong {
				font-weight: bold;
			}
		}
	}
</style>
