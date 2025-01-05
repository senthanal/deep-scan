# Deep Scan

A node app to scan and report license violations for the given npm package using OpenSource Review Toolkit(ORT)

## Motivation

Typical scenario, ORT provides possibility of setting up the company software auditing policies. Running such a ORT scan in every PR commit increases build pipeline runtime drastically. Ideally, we would like to evaluate desired npm package against those company policies before using them.

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

Serving the app

```sh
npm start
```

### Testing the app

```sh
npm test
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

* Hono
* HTMX
* Docker
* ORT

## Author

Senthanal Sirpi Manohar - [Profile](https://github.com/senthanal)


## License

MIT License © Senthanal Sirpi Manohar

