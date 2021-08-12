const https = require('https');
const dns = require('dns');

const user =  process.env.DNS_USER;
const pass = process.env.DNS_PASS;
const domain = process.env.DNS_DOMAIN;

const authBuffer = new Buffer.from(user + ':' + pass);

let hasIP, hasDNS = false;

let dnsIP, myIP;

console.log("Getting IP from DNS server...");
dns.lookup(domain, {
    family: 4,
    hints: dns.ADDRCONFIG,
}, 
(err, address, family) => {
    hasDNS = true;
    console.log("DNS returned: " + address);
    dnsIP = address;
    handler();
});
  
console.log("Getting IP from checkip...");
https.get({
    hostname: 'domains.google.com',
    port: 443,
    path: '/checkip'
}, 
(res) => {
    res.on('data', (d) => {
        hasIP = true;
        console.log("Checkip returned: " + d.toString());
        myIP = d.toString();
        handler();
    });

}).on('error', (e) => {
  console.error(e);
});

function handler(){
    if(hasDNS && hasIP){
        if(dnsIP !== myIP){
            console.log("IP missmatch!");
            console.log("Updating the IP in Google's DNS server...");
            updateIP(domain, authBuffer, myIP);
        }
        else{
            console.log("They are the same, no need to update.");
        }
    }
    return;
}

/**
 * 
 * @param {string} domain The domain to change the IP for
 * @param {Buffer} authBuffer A buffer containing the username and password for the google domains authentication in user:pass format
 * @param {string} ip The updated ip to change on the DNS server
 */
function updateIP(domain, authBuffer, ip){
    let opts = {
        hostname: 'domains.google.com',
        port: 443,
        path: '/nic/update?hostname=' + domain + "&myip=" + ip,
        headers: { 'Authorization': 'Basic ' + authBuffer.toString('base64') }
    }

    https.get(opts, (res) => {
        // console.log('statusCode:', res.statusCode);
        // console.log('headers:', res.headers);
    
        res.on('data', (d) => {
            let r = d.toString().split(" ");
            switch (r[0]) {
                case "good":
                    console.log("Successfully updated the ip to: " + r[1]);
                    break;
                case "nochg":
                    console.log("The ip was not changed: " + r[1]);
                    break;
                case "nohost":
                    console.error("The hostname does not exist, or does not have Dynamic DNS enabled.");
                    break;
                case "badauth":
                    console.error("The username / password combination is not valid for the specified host.");
                    break;
                case "notfqdn":
                    console.error("The supplied hostname is not a valid fully-qualified domain name.");
                    break;
                case "badagent":
                    console.error("Your Dynamic DNS client is making bad requests. Ensure the user agent is set in the request.");
                    break;
                case "abuse":
                    console.error("Dynamic DNS access for the hostname has been blocked due to failure to interpret previous responses correctly.");
                    break;
                case "911":
                    console.error("An error happened on our end. Wait 5 minutes and retry.");
                    break;
                case "conflict":
                    console.error("A custom "+ r[1] +" resource record conflicts with the update. Delete the indicated resource record within DNS settings page and try the update again. ");
                    break;
            
                default:
                    console.log("Unknown response from " + opts.hostname + ": " + r.toString());
                    break;
            }

        });
    
    }).on('error', (e) => {
      console.error(e);
    });
}
