# RDA Service Manager

starting and stopping RDA service


## API


```javascript
import ServiceManager from '@infect/rda-service-manager';

// pass the args that need to be passed to the processes
// running the service to the service manager
const manager = new ServiceManager({
    args: '--dev --log-level=error+ --log-module=*'.split(' ')
});


// start services by their name. the service manager is looking for 
// them in the node_modules and in the local file system on the same
// level as the project the service manager is executed in
await sm.startServices('rda-service-registry');

// stop a specific service, if no parameters are passed all services
// are stopped
await sm.stopServices('rda-service-registry');
```

### Constructor

The constructor accepts an array with command line paramters that 
are then passed to the child processes starting services.

```javascript
const manager = new ServiceManager({
    args: '--dev --log-level=error+ --log-module=*'.split(' ')
});
```


#### manager.startServices()

Starts services in the order passed to this function. the service 
manager is looking for the services in the node_modules and in the 
local file system on the same level as the project the service manager 
is executed in

```javascript
await sm.startServices(serviceName[, serviceName, [...]]);
```


#### manager.stopServices()

Stops the services that have one of the names passed to the method. 
If no name is passed all services are stopped. Services are stopped
in the reverse order they were started. 

```javascript
await sm.stopServices(serviceName[, serviceName, [...]]);
```
