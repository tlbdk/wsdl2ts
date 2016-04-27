// https://github.com/buglabs/node-xml2json
// https://github.com/vpulim/node-soap

var sample = {
    "soap:Envelope$attibutes": {
        "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope/",
        "soap:encodingStyle": "http://www.w3.org/2003/05/soap-encoding",
    },
    "soap:Envelope": {
        "soap:Header": {    
        },
        "soap:Body": {
            "value": "stuff",
            "values$attibutes": { 
                "xmlns:stuff": "morestuff"
            },
            "values": {
                "value": [""]
            },
            "soap:Fault": { 
            },    
        },
         
    },
    "soap:Envelope$order": ["$soap:encodingStyle", "$xmlns:soap","soap:Header", "soap:Body"]
    
};


function toXML(parentObj) {
    var result = "";
    var order = parentObj["$order"];
    var keys = Object.getOwnPropertyNames(parentObj);
    var attibutes = parentObj["$"];
    
    if(order) {
        keys = keys.sort(function(a, b) {
            order.indexOf(a) - order.indexOf(b)
        });
        attibutes = attibutes.sort(function(a, b) {
            order.indexOf("$" + a) - order.indexOf("$" + b)
        });
    }
    
    for(var key in keys) {
        if(key === "$" || key === "$order") continue;
        
        var current = parentObj[key];
        if(typeof current === undefined || current === null) {
            // TODO: Handle null types
            
        } else if(Array.isArray(current)) {
            result += "<" + key + getAttibutesXML() + ">";   
            result += "<" + key + getAttibutesXML() + ">";   
             
        
        } else if(typeof current === "object") {
            result += "<" + key + getAttibutesXML() + ">";    
        
        } else {
            
        }
    }
}

function getAttibutesXML() {
    return "";
}