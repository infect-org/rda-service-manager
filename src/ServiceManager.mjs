import Child from './Child.mjs';
import path from 'path';
import fs from 'fs';


/**
 * used to start and stop service for testing and fun
 */
export default class ServiceManager {

    /**
     * set up the manager
     *
     * @param      {Object}  arg1       options
     * @param      {array}   arg1.args  commandline arguments to pass to the service
     */
    constructor({
        args,
    }) {
        this.args = args;
        this.services = new Set();
    }




    /**
     * stop all running services
     *
     * @return     {Promise}  undefined
     */
    async stopServices() {

        // stop all services, make sure to do this in reverse order
        const services = [...this.services.values()].reverse();
        for (const service of services) {
            await service.stop();
        }
    }





    /**
     * start services don't wait until are available
     *
     * @param      {Array}    serviceNames  names of service to start
     * @return     {Promise}  undefined
     */
    async startServices(...serviceNames) {

        // try to load all modules
        for (const serviceName of serviceNames) {
            const modulePath = await this.getModulePath(serviceName);

            this.services.add(new Child({
                modulePath,
                args: this.args,
            }));
        }

        // looks god, create child processes
        for (const service of this.services.values()) {
            if (!service.loaded) await service.load();
        }


        // looks god, start them
        for (const service of this.services.values()) {
            if (!service.started) await service.start();
        }
    }






    /**
     * looks if a given package can be found on the same level as the current package or in the node
     * modules folder.
     *
     * @param      {string}   serviceName  the name of the service to resolve the path for
     * @return     {Promise}  The module path.
     */
    async getModulePath(serviceName) {
        const sameLevelDir = path.join(process.cwd(), '../', serviceName, 'index.mjs');
        const modulesDir = path.join(process.cwd(), 'node_modules', serviceName, 'index.mjs');

        return this.fileExists(sameLevelDir).catch(() => {
            return this.fileExists(modulesDir).catch(() => {
                throw new Error(`Module '${serviceName}' could not be found in folder '${sameLevelDir}' or '${modulesDir}'!`);
            });
        });
    }


    /**
     * checks if a file exists
     *
     * @param      {<type>}   file    path tot the file
     * @return     {Promise}  the file path
     */
    fileExists(file) {
        return new Promise((resolve, reject) => {
            fs.access(file, fs.constants.F_OK, (err) => {
                if (err) reject(err);
                else resolve(file);
            });
        });
    }



    /**
     * start one service
     *
     * @param      {string}   serviceName  The service name
     * @return     {Promise}  undefined
     */
    async startService(serviceName) {
        await this.startServices(serviceName);
    }
}
