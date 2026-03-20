export const sampleMarkdown = String.raw`# Markdown PDF Renderer

這是內建範例，可直接測試 Markdown、LaTeX 與 Mermaid 的預覽與 PDF 匯出。

## LaTeX

行內公式：$E = mc^2$

區塊公式：

$$
J(\theta) = \sum_{i=1}^{n}\left(y_i - \hat{y}_i\right)^2
$$

## Mermaid

~~~mermaid
flowchart TD
    A[選擇 Markdown] --> B[轉成 HTML]
    B --> C[MathJax 渲染公式]
    B --> D[Mermaid 渲染圖表]
    C --> E[匯出 PDF]
    D --> E
~~~

## 表格

| 項目 | 說明 |
| --- | --- |
| 主色 | \`#141413\` |
| 背景 | \`#FAF9F5\` |
| Accent | \`#D97757\` |
| 表格內 Markdown | **粗體**、\`inline code\`、[連結](https://example.com) |
`;
