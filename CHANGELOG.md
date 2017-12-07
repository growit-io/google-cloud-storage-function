# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2017-12-07
### Changed
- The main module exports a Cloud Function constructor to make the event handling logic reusable.
- Runtime configuration can be supplied to the Cloud Function constructor.
- Configuration options can now be supplied in the optional file `config.json`.
- The optimise action falls back to copying the unoptimised source file on error.
- Storage and config are now non-global to prepare for loading `config.json` from Cloud Storage.
- Removed most of the hard-coded default configuration (image actions and rules).

[Unreleased]: https://github.com/growit-io/google-cloud-storage-function/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/growit-io/google-cloud-storage-function/commits/v0.1.0
