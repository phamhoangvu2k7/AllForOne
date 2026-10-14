<script setup lang="ts">
import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'

marked.use(markedKatex({ throwOnError: false, nonStandard: true }))

const props = defineProps<{ source?: string }>()

const html = computed(() => {
  if (!props.source) return ''
  try {
    const raw = marked.parse(props.source, { async: false }) as string
    return DOMPurify.sanitize(raw, {
      ADD_TAGS: ['annotation', 'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mover', 'munder', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd'],
      ADD_ATTR: ['xmlns', 'display'],
    })
  } catch (err) {
    console.error('Markdown parse error:', err)
    return props.source
  }
})
</script>

<template>
  <div class="markdown-body prose max-w-none text-gray-800 leading-relaxed text-sm md:text-base select-text" v-html="html" />
</template>

<style scoped>
.markdown-body :deep(p) {
  margin-bottom: 0.5rem;
}
.markdown-body :deep(.katex-display) {
  margin: 0.75rem 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0;
}
.markdown-body :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
</style>

