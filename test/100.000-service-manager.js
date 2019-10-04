import section from 'section-tests';
import ServiceManager from '../src/ServiceManager.js';





section('Service Manager', (section) => {

    section.test('Create instance', async() => {
        new ServiceManager({
            args: []
        });
    });


    section.test('Execute the service registry service & end it thereafter', async() => {
        section.setTimeout(5000);


        const sm = new ServiceManager({
            args: '--dev.testing --log-level=error+ --log-module=*'.split(' ')
        });


        section.notice('starting service ...');
        await sm.startServices('@infect/rda-service-registry');
        await section.wait(200);


        section.notice('stopping service ...');
        await sm.stopServices('@infect/rda-service-registry');
    });
});
