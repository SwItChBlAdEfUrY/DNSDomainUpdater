# Domain Updater
This is a node script to update your Google Domains DDNS IP with the address of the computer it was ran from.

---

The script uses three enviroment variables to store your API user and pass.

```DNS_USER``` - Your google domains API username.

```DNS_PASS``` - Your google domains API password.

```DNS_DOMAIN``` - Your website's domain (do not include the protocol) ex: `example.com`

Make sure to add these to your system enviroment variables, or replace the lines "process.env.`VAR`" in the script file with your strings.  
