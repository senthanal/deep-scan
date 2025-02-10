# Deep Scan

Primarily a node cli to scan project dependencies for license violations using OpenSource Review Toolkit(ORT).

## Motivation

Typical scenario, ORT provides possibility of setting up the company software auditing policies. Running such a ORT scan in every PR commit increases build pipeline runtime drastically. This project aims to provide a solution to run ORT scan on the project dependencies and provide the results in a timely manner.

## Architecture

[Application Architecture Diagram](./documentation/application_architecture_diagram.drawio.png)

## Getting Started

### Prerequisites

* Docker
* node >= 18.18.2
* npm >= 9.8.1

### Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

Start with cloning this repo on your local machine:

```sh
git clone https://github.com/senthanal/deep-scan.git
cd PROJECT
```

Run installation

```sh
npm install
```

### Usage

Help command

```sh
npx @senthanal/deep-scan-cli@latest --help
npx @senthanal/deep-scan-cli@latest gitProject --help
npx @senthanal/deep-scan-cli@latest project --help
npx @senthanal/deep-scan-cli@latest package --help
```

Scan ORT for a GIT project dependencies in compliance with the company policies

```sh
npx @senthanal/deep-scan-cli@latest gitProject -p <git project url> -q <git project branch> -c <git project config url> -d <git project config branch> -e <ORT config root folder within the repository> -r <ORT results path> -l <enable windows long path>

```

Scan ORT for the project dependencies in compliance with the company policies

```sh
npx @senthanal/deep-scan-cli@latest project -p <project-path> -c <ort-config-path> -r <ort-result-path>
```

Scan ORT for validating a npm package in compliance with the company policies

```sh
npx @senthanal/deep-scan-cli@latest package -p <package-name> -v <package-version> -c <ort-config-repo-url>
```

### Testing the CLI

```sh
npm test
```

## Bonus

### Web Application to Scan a npm package
```sh
npm run serve
```

## Contributing

````markdown
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Add your changes: `git add .`
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull
````

## Built With
* Commander
* Docker
* ORT
* ora
* yoctocolors
### Web Application to Scan a npm package
* Hono
* HTMX


## Author

Senthanal Sirpi Manohar - [Profile](https://github.com/senthanal)


## License

MIT License © Senthanal Sirpi Manohar

