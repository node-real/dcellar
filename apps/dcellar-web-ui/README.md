# DCellar-web-ui
DCellar-web-ui is a decentralized application (dapp) built with Next.js

## Getting Started
To get a local copy up and running, please follow these simple steps.
### Prerequisites
Here is what you need to be able to run dcellar-web-ui

- Node.js (Version: >=18.x)
- [@microsoft/rush](https://rushjs.io/pages/intro/get_started/) (Version: >=5.112.x)
## Development
### Setup
1. Clone the repository:
    ```bash
    git clone git@github.com:node-real/dcellar.git
    ```
2. Go to the project folder
    ```bash
    cd dcellar/apps/dcellar-web-ui
    ```
3. Install dependency and build symbolic links for apps:
    ```bash
    rush install
    ```
4. Set up your `.env` file
    ```bash
    cp .env.example .env.local
    ```
5. You can run `rushx` command to run scripts in `package.json`.

    ```bash
    # rushx is just like npm run
    rushx dev  # It will run 'dev' script in package.json
    ```
Open [http://localhost:3200](http://localhost:3200) with your browser to see the result.

## Environment Variable Management
We utilize [Next.js environment variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables), particularly the NEXT_PUBLIC_ENV variable, to distinguish between different environments. This method is suitable for variables that remain relatively static. For more dynamic environment data and alert notifications, we leverage [`Apollo`](https://www.apolloconfig.com/#/).

If Apollo is not preferred, reliance solely on Next.js environment variables for management is feasible.

Should you choose to forego Apollo, you can remove all Apollo configuration code. Additionally, any references to Apollo variables within the code should be updated to use Next.js environment variables instead.

## Accessing BNB Greenfield Billing and Enhance API
To integrate the BNB Greenfield Billing API for accessing user monthly bills, billing history, and total costs, as well as the Enhanced API for retrieving folder policies and Daily Bucket Storage List, follow these steps:

1. **[Register with nodereal](https://nodereal.io/)**: Sign up for an account on the nodereal to access the APIs.
2. **[Create New Key](https://dashboard.nodereal.io/)**: Create a new API key to authenticate your requests.
3. **[Obtain API Endpoints](https://nodereal.io/api-marketplace)**: Visit the web3 API Marketplace to find the Billing API and Enhanced API.
    - [BNB Greenfield Testnet Billing API](https://nodereal.io/api-marketplace/bnb-greenfield-testnet-billing-api)
    - [BNB Greenfield Testnet Enhanced API](https://nodereal.io/api-marketplace/bnb-greenfield-testnet-enhanced-api)
    - [BNB Greenfield Mainnet Billing API](https://nodereal.io/api-marketplace/bnb-greenfield-mainnet-billing-api)
    - [BNB Greenfield Mainnet Enhanced API](https://nodereal.io/api-marketplace/bnb-greenfield-mainnet-enhanced-api)
4. **Configure DCellar-web-ui**: Replace `NEXT_PRIVATE_BILLING_API_URL` and `NEXT_PRIVATE_EXPLORER_API_URL` in your DCellar-web-ui environment variables with the obtained API endpoints.

With these steps, you can seamlessly integrate the BNB Greenfield Billing and Enhanced APIs into your DCellar-web-ui application, unlocking access to the complete dashboard and account modules.

## Contributing
Please follow our [DCellar Contribution Guide](../../CONTRIBUTING.md).


## License
See [LICENSE](../../LICENSE) for more information.