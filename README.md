# ChaiCode AI Agent CLI - Website Cloner

A powerful CLI tool to clone websites for fully offline use with HTML/CSS/JS/assets, link rewriting, and optional local server.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```bash
# Clone a website
node bin/siteclone.js <URL> [options]

# Example: Clone VS Code website
node bin/siteclone.js https://code.visualstudio.com --out dist/vscode --max-pages 50 --serve 3000 --open
```

## 📖 How to Input Website Links

### Method 1: Direct Command Line

```bash
# Basic cloning
node bin/siteclone.js https://example.com

# With custom options
node bin/siteclone.js https://example.com --out dist/example --max-pages 100 --serve 4000
```

### Method 2: Using NPM Scripts (Recommended)

Add your favorite sites to `package.json`:

```json
{
  "scripts": {
    "clone:mysite": "node bin/siteclone.js https://mywebsite.com --out dist/mysite --max-pages 50 --serve 4000"
  }
}
```

Then run:

```bash
npm run clone:mysite
```

### Method 3: Pre-configured Demo Sites

```bash
npm run demo:vscode          # Clone VS Code website (50 pages)
npm run demo:github          # Clone GitHub (30 pages)
npm run demo:piyush          # Clone piyushgarg.dev (25 pages)
npm run demo:codeoptimalsolutions  # Clone codeoptimalsolutions.com (40 pages)
npm run demo:100xdevs        # Clone 100xdevs app (20 pages)
```

### Method 4: Template Scripts by Size

```bash
# For small sites (10 pages max)
URL=https://example.com npm run clone:small

# For medium sites (50 pages max)  
URL=https://example.com npm run clone:medium

# For large sites (200 pages max)
URL=https://example.com npm run clone:large
```

## ⚙️ Configuration Options

| Option             | Alias | Description                      | Default     |
| ------------------ | ----- | -------------------------------- | ----------- |
| `--out`            | `-o`  | Output directory                 | `dist/site` |
| `--max-pages`      |       | Maximum pages to crawl           | `100`       |
| `--same-origin`    |       | Only download same-origin assets | `true`      |
| `--concurrency`    |       | Download concurrency             | `10`        |
| `--timeout`        |       | HTTP timeout (ms)                | `20000`     |
| `--respect-robots` |       | Respect robots.txt               | `true`      |
| `--serve`          |       | Start local server on port       | -           |
| `--open`           |       | Open browser after serving       | `false`     |

## 📝 Examples

### Clone and Serve Locally

```bash
# Clone website and start local server
node bin/siteclone.js https://example.com --serve 3000 --open

# Clone with custom settings
node bin/siteclone.js https://docs.github.com \
  --out dist/github-docs \
  --max-pages 200 \
  --concurrency 5 \
  --serve 4000 \
  --open
```

### Using --max-pages Option

```bash
# Clone only homepage and a few pages (fast)
node bin/siteclone.js https://example.com --max-pages 5

# Clone moderate amount of content
node bin/siteclone.js https://example.com --max-pages 50 --out dist/medium-site

# Clone extensive content (be careful with large sites)
node bin/siteclone.js https://example.com --max-pages 500 --out dist/large-site

# Combine with other options
node bin/siteclone.js https://example.com \
  --max-pages 100 \
  --out dist/custom \
  --concurrency 15 \
  --serve 3000 \
  --open
```

### Batch Cloning Multiple Sites

Create a script file `clone-sites.sh`:

```bash
#!/bin/bash
# Clone multiple sites with different page limits
node bin/siteclone.js https://site1.com --out dist/site1 --max-pages 50
node bin/siteclone.js https://site2.com --out dist/site2 --max-pages 30  
node bin/siteclone.js https://site3.com --out dist/site3 --max-pages 100

# Or use the template scripts
URL=https://smallsite.com npm run clone:small
URL=https://mediumsite.com npm run clone:medium
URL=https://largesite.com npm run clone:large
```

## 🛠️ Features

- **Complete Website Cloning**: Downloads HTML, CSS, JS, images, and other assets
- **Link Rewriting**: Automatically rewrites links for offline browsing
- **Robots.txt Respect**: Optionally respects robots.txt rules
- **Local Server**: Built-in server for testing cloned sites
- **Concurrent Downloads**: Configurable concurrency for faster cloning
- **Same-Origin Policy**: Option to only download same-origin assets

## 🔧 Troubleshooting

### Common Issues

1. **URL Required Error**

   ```
   ❌ Error: Website URL is required
   ```

   **Solution**: Provide a valid URL as the first argument

2. **Invalid URL Format**

   ```
   ❌ Error: URL must start with http:// or https://
   ```

   **Solution**: Ensure URL includes protocol (http:// or https://)

3. **Permission Errors**
   - Ensure you have write permissions to the output directory
   - Try running with appropriate permissions

### Getting Help

```bash
node bin/siteclone.js --help
```

## 📁 Output Structure

After cloning, your output directory will contain:

```
dist/
└── site/
    ├── index.html
    ├── assets/
    │   ├── css/
    │   ├── js/
    │   └── images/
    └── [other-pages].html
```

## 🚀 Advanced Usage

### Custom Output Directory

```bash
node bin/siteclone.js https://example.com --out /path/to/custom/directory
```

### High-Performance Cloning

```bash
node bin/siteclone.js https://example.com \
  --max-pages 1000 \
  --concurrency 20 \
  --timeout 30000
```

### Development Workflow

```bash
# Clone and immediately serve for development
node bin/siteclone.js https://example.com --serve 3000 --open
```

## 📄 License

ISC License
