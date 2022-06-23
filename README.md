# Generative terrain NFT for fxhash.xyz, with threejs
This is the full code for the tutorial released on [generativehut.com](https://www.generativehut.com/post/generative-terrain-nfts-for-fxhash-in-three-js).

Tutorial text is also available at `./tutorial/TUTORIAL.md` in a markdown format.  

## Project on fxhash
The project is released under this [link](). 256 edition, for 5 tezos. 90% of the proceedings (including secondary shares/royalties) go to [this](https://tzkt.io/KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx/) donation contract, which was setup by the fxhash and the [Versum](https://versum.xyz/) team. This contract splits the received funds between different charities ([Save The Children](https://thegivingblock.com/donate/save-the-children/), [Direct Relief](https://thegivingblock.com/donate/direct-relief/), etc.). You can read more on the contract [here](https://github.com/teia-community/teia-docs/wiki/Ukranian-Fundraising). If you want to support a good cause, mint one for yourself!:)

# How to use

You will need to have [nodejs](https://nodejs.org/) installed.

## Installation

> First, make sure that your node version is >= 14

Clone the repository on your machine and move to the directory
```sh
$ git clone https://github.com/danielpetho/terrestrial.git your_folder && cd your_folder
```

Install the packages required for the local environment
```sh
$ npm i
```

## Start local environment

```sh
$ npm start
```

This last command will start a local http server with [live reloading](https://webpack.js.org/configuration/dev-server/#devserverlivereload) enabled so that you can iterate faster on your projects. Open [http://localhost:8080](http://localhost:8080) to see your project in the browser.

## Build

```sh
$ npm run build
```

Will bundle your js dependencies into a single minified `bundle.js` file, move your files from the `public/` to the `dist/` folder, and link the `bundle.js` with the `index.html`.

**Moreover, it will create a `dist-zipped/project.zip` file which can be directly imported on fxhash**.

## License
MIT

## Feedback
Feel free to open a pull request, or ask any question.