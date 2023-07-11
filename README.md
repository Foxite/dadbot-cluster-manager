# Dad Bot Cluster Manager

The Dad Bot Cluster Manager is a simple server that allows the clusters to communicate with each other and also """"""very efficiently"""""" stores historical data about the clusters for our internal grafana monitoring.

## Contributing

Contributing is super simple, you can fork the repo, make your contribution, and make a PR. AlekEagle will review the PR, and do the normal PR review thingys.

## Running Your Own Instance

Since Dad Bot and the various components are all essentially spaghetti code, it's unnecessarily complicated without any guidance. So here's that guidance.

1. Follow the initial setup instructions for [Dad Bot](https://github.com/AlekEagle/dadbot#running-your-own-instance) until you get to the step where it tells you to "make sure the cluster manager is configured correctly". Then come back here.
2. Prepare the `.env` file (There is an example in the repo, you can start from there and modify it as needed)
3. Set up the users that are allowed to connect to the cluster manager. You do this by creating a file called `users.json` in the `config` directory, there is an example in that directory, you can start from there and modify it as needed. The example file also explains how to get the token for a cluster client.
4. Set up a PostgreSQL database and give the cluster manager its own database user with full access to that database. It'll create the tables it needs on its own.
5. (Optional, but recommended for production environments) Replace the placeholder fields in the `dadbot-cluster-manager.service` file with the correct paths and user information, then copy it to `/etc/systemd/system/` and run `systemctl daemon-reload` to reload the systemd daemon, then run `systemctl enable dadbot-cluster-manager` to enable the service.
6. Run the damn thing.
   - Systemd: `systemctl start dadbot-cluster-manager`
   - Manually: `node .`

Need extra logs for debugging? Set the `DEBUG` environment variable to `true` and it'll log additional information to the console.
