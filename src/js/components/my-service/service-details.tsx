import React from 'react';
import { Service } from 'js/model';
import Loader from '../commons/loader';

interface Props {
	service?: Service;
}
const ServiceDetails = ({ service }: Props) =>
	service ? <div>Service details : {service.name}</div> : <Loader />;

export default ServiceDetails;
