import path from 'path';
import fs from 'fs';
import Child from './Child.js';
import colors from 'colors';


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

        
        if (process.argv.includes('--debug-memory')) {
            this.memoryData = new Map();
            this.intervals = [1, 5, 10, 20, 30, 45, 60, 120, 180, 240, 360, 420, 480, 540, 600];
            setInterval(() => this.reportMemory().catch(console.log), 60000);
        }

       /* setTimeout(() => {
            this.snapshotHeap().catch(console.log);
        }, 240000);
        setTimeout(() => {
            this.snapshotHeap().catch(console.log);
        }, 320000);*/
    }



    async snapshotHeap() {
        for (const service of this.services.values()) {
            if (service.serviceName.includes('rda-compute')) {
                const data = await service.snapshotHeap();
                console.log(data.fileName);
                break;
            }
        }
    }




    async reportMemory() {
        for (const service of this.services.values()) {
            const data = await service.getMemory();

            if (!this.memoryData.has(service.serviceName)) {
                this.memoryData.set(service.serviceName, []);
            }

            this.memoryData.get(service.serviceName).push({
                time: Date.now(),
                usedMemory: data.data.usedMemory,
            });
        }


        console.log(this.getTitleLine());

        for (const [serviceName, timeSeries] of this.memoryData) {
            console.log(this.getStatLine(serviceName, timeSeries, timeSeries[timeSeries.length-1].usedMemory));
        }
    }



    getMemoryDiffValue(timeSeries, N) {
        return `${this.getMemoryinMB(timeSeries[timeSeries.length-1].usedMemory - timeSeries[timeSeries.length-(N+1)].usedMemory)}`;
    }


    getMemoryinMB(N) {
        return `${Math.round(N/10000)/100}M`;
    }


    getTimeString(N) {
        if (N < 60) return `${N}min`;
        else return `${N/60}h`;
    }


    getStatLine(serviceName, timeSeries, usedMemory) {
        let str = serviceName.padEnd(43, ' ').green;
        str += ` | ${this.getMemoryinMB(usedMemory)}`.padEnd(15).blue.bold;

        for (const minutes of this.intervals) {
            let val = '';

            if (timeSeries.length > minutes) {
                val = this.getMemoryDiffValue(timeSeries, minutes);
            }

            val = val.padEnd(10, ' ');
            str += ` | ${val.includes('-') ? val.red.bold : val.yellow.bold}`;
        }


        return str;
    }


    getTitleLine() {
        let str = 'Service Name'.padEnd(43, ' ');
        str += ' | Memory Usage'.padEnd(15, ' ');

        for (const minutes of this.intervals) {
            str += ` | ${this.getTimeString(minutes).padEnd(10, ' ')}`;
        }

        return str + '\n' +'-'.repeat(str.length);
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
            this.services.delete(service);
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
                serviceName,
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
        const sameLevelDir = path.join(process.cwd(), '../', serviceName, 'index.js');
        const modulesDir = path.join(process.cwd(), 'node_modules', serviceName, 'index.js');

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
