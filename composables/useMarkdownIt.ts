import type { Options } from 'markdown-it'
import MarkdownIt from 'markdown-it'

const markdownItConfig: Options = {
  html: true,
  linkify: true,
  breaks: true,
  typographer: true,
}

const md = new MarkdownIt(markdownItConfig).disable(['list'])

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // Add Tailwind CSS classes to style links
  tokens[idx].attrPush(['class', 'p-button-link'])
  // open links in new tab
  tokens[idx].attrPush(['target', '_blank'])
  // noopener to prevent new page accessing originating window
  // noreferrer do not send refer header, protect privacy of user
  // and prevent destination site from knowing where the visitor came from
  tokens[idx].attrPush(['rel', 'noopener noreferrer'])
  return self.renderToken(tokens, idx, options)
}

export function useMarkdownIt() {
  return md
}
