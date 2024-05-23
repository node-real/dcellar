# Change Log - dcellar-web-ui

This log was last generated on Thu, 23 May 2024 03:42:29 GMT and should not be manually modified.

## 1.5.0
Thu, 23 May 2024 03:42:29 GMT

### Minor changes

- Support sponsor payment account
- Introduce the migrate bucket feature

## 1.4.0
Thu, 16 May 2024 09:14:19 GMT

### Minor changes

- Introduce the activities feature for bucket, object and group
- Introduce the stop upload feature

## 1.3.2
Sat, 11 May 2024 05:44:13 GMT

### Patches

- Update getObjectMeta request cache header and policy

## 1.3.1
Sat, 11 May 2024 03:15:50 GMT

### Patches

- Upgrade nextjs to aviod attacks via CVE-2024-34351 vulnerability
- Fix the issue with browser cache getObjectMeta API

## 1.3.0
Fri, 10 May 2024 08:02:26 GMT

### Minor changes

- Cache pricing data for other landing page

## 1.2.0
Thu, 09 May 2024 06:16:58 GMT

### Minor changes

- Introduce retry upload functionality
- Add toolbox page

## 1.1.0
Mon, 29 Apr 2024 06:35:57 GMT

### Minor changes

- Support object versions & replace object

## 1.0.3
Mon, 22 Apr 2024 03:46:28 GMT

### Patches

- Fix the lost latency issue when creating bucket

## 1.0.2
Mon, 22 Apr 2024 02:11:28 GMT

### Patches

- Fix the lost input error status when changing SP or payment account

## 1.0.1
Fri, 19 Apr 2024 01:57:15 GMT

### Patches

- Fix object sealing issue

## 1.0.0
Thu, 18 Apr 2024 06:02:22 GMT

### Breaking changes

- Increased upload limit to 500 files/session, each restricted to 1GB
- Added support for delegateUpload and delegateCreateFolder features
- Integrated new off-chain authentication flow
- Utilized tables for efficient management of pending and uploading lists
- Supported monthly quota feature
- Updated tags module to calculate string length in bytes

## 0.6.0
Wed, 17 Apr 2024 03:19:45 GMT

### Minor changes

- Add connect-wallet page & tutorial card

## 0.5.0
Thu, 11 Apr 2024 02:29:47 GMT

### Minor changes

- make created on chain status object deletable

## 0.4.0
Mon, 25 Mar 2024 04:02:13 GMT

### Minor changes

- Support create on chain folder & share virtual path

## 0.3.1
Wed, 20 Mar 2024 07:14:31 GMT

### Patches

- disable selection of SPs with invalid status in SPSelector

## 0.3.0
Fri, 15 Mar 2024 09:48:45 GMT

### Minor changes

- Unify the package name of dcellar-web-ui

## 0.2.0
Fri, 15 Mar 2024 09:20:32 GMT

### Minor changes

- Support deploy by tag

## 0.1.0
Thu, 14 Mar 2024 13:51:23 GMT

### Minor changes

- Initial release of dcellar, including fundamental features.

