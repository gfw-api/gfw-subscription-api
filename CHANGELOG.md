# 19/02/2020
- Add endpoint for finding subscriptions by id.
- Add endpoint for finding all subscriptions for a given user.
- Add possibility of creating, updating or deleting subscriptions that belong to other users when endpoints are called by other MSs.

# 22/01/2020
- Add support for webhook-based subscription notifications.

# 28/11/2019
- Use dataset's metadata name field on subscription emails, instead of dataset's name

# 19/11/2019

- Add additional tests
- Add support for dataset overwrite using multiple files in parallel.
- Update node version to 12.
- Replace npm with yarn.
- Add liveliness and readiness probes.
- Add resource quota definition for kubernetes.
