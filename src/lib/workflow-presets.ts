export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  filename: string;
  content: string;
}

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: 'npm-release',
    name: 'NPM Release',
    description: 'Automates publishing a new version to NPM on new GitHub releases.',
    filename: 'npm-release.yml',
    content: `name: NPM Release

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`
  },
  {
    id: 'auto-tag',
    name: 'Auto Tag',
    description: 'Automatically creates a new tag when changes are pushed to the main branch.',
    filename: 'auto-tag.yml',
    content: `name: Auto Tag

on:
  push:
    branches:
      - main

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Bump version and push tag
        uses: anothrNick/github-tag-action@1.36.0
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          DEFAULT_BUMP: patch
`
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages Deploy',
    description: 'Builds and deploys a static site to GitHub Pages.',
    filename: 'github-pages.yml',
    content: `name: Deploy to GitHub Pages

on:
  # Runs on pushes targeting the default branch
  push:
    branches: ["main"]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build # Or your build command
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          # Upload your build output directory
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
`
  }
];