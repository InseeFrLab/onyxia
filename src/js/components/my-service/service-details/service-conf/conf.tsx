import React from 'react';
import { Service } from 'js/model';
import ServiceEnv from '../service-env';

interface Props {
	service: Service;
}

const ServiceConf = ({ service }: Props) => {
	return <ServiceEnv service={service} />;
};

export default ServiceConf;
