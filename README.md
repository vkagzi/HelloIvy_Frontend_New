# Project README

## Getting Started

This project uses a **Dev Container** for a consistent development environment. We recommend using **VS Code** with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

### Local Development

1. **Open in Dev Container**

- Open the project in VS Code.
- Use the **"Reopen in Container"** command to start the Dev Container.

2. **Install Dependencies**

- Dependencies are installed automatically when the container starts.

3. **Start the Development Server**

```bash
npm run dev
```

The app will be available at [http://localhost:12321](http://localhost:12321).

### Pre-commit Hooks

- **Husky** is configured to run pre-commit checks (linting, formatting, etc.).
- **Do not bypass or ignore** these hooks; they help maintain code quality and consistency.

---

For more details, see the documentation in each subdirectory or reach out to the maintainers.

> (hello) Partnerss-MacBook-Air:helloivy-web-main partners$ npm install
> bash: npm: command not found

⏺ You need to install Node.js and npm first. Here are the options:

Option 1: Install via Homebrew (Recommended)

# Install Homebrew if you don't have it

/bin/bash -c "$(curl -fsSL
https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (includes npm)

brew install node

Option 2: Download from Official Website

1. Go to https://nodejs.org/
2. Download the LTS version for macOS
3. Run the installer

Option 3: Install via Node Version Manager (nvm)

# Install nvm

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh |
bash

# Restart terminal or run:

source ~/.bashrc

# Install latest Node.js

nvm install node
nvm use node

After installation, verify with:
node --version
npm --version

Then you can run:
npm install
npm run dev
