class CodeGenUtils {
    constructor(wsdlString) {
        this.wsdlutils = new WSDLUtils(wsdlString);
    }

    generateClient() {
        throw new Error("Not implemented");
    }

    generateSample() {
        throw new Error("Not implemented");
    }

    generateServer() {
        throw new Error("Not implemented");
    }
}
