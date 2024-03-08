# DCellar Web


## Documentation Links
- [What is BNB Greenfield chain?](https://github.com/bnb-chain/greenfield-whitepaper) - learn about the the mission behind the chain.
- [Guide to BNB Greenfield](https://docs.bnbchain.org/greenfield-docs/docs/guide/home)
- [BNB Greenfield Release Notes](https://docs.bnbchain.org/greenfield-docs/docs/release-notes/releaseNotes/#greenfield-v023---testnet-maintenance-upgrade-reset)
- [BNB Greenfield RPC Endpoints](https://docs.bnbchain.org/greenfield-docs/docs/api/endpoints/) - Find the latest rpc info
- [What is DCellar?](https://docs.nodereal.io/docs/dcellar-get-started) - learn about the usage of DCellar
- [Apollo](https://github.com/apolloconfig/apollo) - A reliable configuration management system.
- [@bnb-chain/greenfield-js-sdk](https://docs.bnbchain.org/greenfield-js-sdk/) - learn about how to interactive with chain or storage provider.
- [@node-real/uikit](https://node-real.github.io/uikit/#/guides) - our recommended UI library.

## Prepare
1. Install the Rush tool as global package:
  ```$ npm install -g @microsoft/rush@5.112.1```
2. Install dependency and build symbolic links for apps:
  ```$ rush install```
3. cd into the app's directory, and make it will be your working directory:
  ```$ cd apps/dcellar-web-ui```
4. Copy `.env.example` to `.env.local`:
  ```$ mv .env.example .env.local```

## Start the project
You can run rushx command to run scripts in package.json.
```
$ rushx dev  # It will run 'dev' script in package.json
```
rushx is just like npm run

Now you can modify things and see the changes.
