import React from 'react';
import { Redirect } from 'react-router-dom';
import Loader from 'js/components/commons/loader';

const SecretHome = ({ idep, data }) =>
	idep && data ? <Redirect to={`mes-secrets/${idep}`} /> : <Loader em={18} />;

export default SecretHome;
