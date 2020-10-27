import React, { useState, useEffect } from 'react';
import CopyableField from 'js/components/commons/copyable-field';
import D from 'js/i18n';
import type { actions as userActions } from "js/redux/user";
import type { HandleThunkActionCreator } from "react-redux";

interface Props {
	values: object;
	idep: string;
	updateVaultSecret: HandleThunkActionCreator<typeof userActions["updateVaultSecret"]>;
}

const labels = {
	git_user_name: D.gitUserName,
	git_user_mail: D.gitUserEmail,
	git_credentials_cache_duration: D.gitCacheDuration,
};

const GitField = ({ values, idep, updateVaultSecret }: Props) => {
	const [git, setGit] = useState({});

	useEffect(() => {
		setGit(getGitData(values));
	}, [values]);

	if (Object.values(git).length === 0) return null;
	const onValidate = (k: string, v: string) => {
		updateVaultSecret({
			"location": `/${idep}/.onyxia/profile`,
			"data": { [k]: v },
		});
	};
	return (
		<>
			{Object.entries(git).map(([k, v]) => (
				<CopyableField
					key={k}
					copy
					label={(labels as any)[k] || k}
					value={`${v}`}
					type="string"
					onChange={(newV: string) => {
						setGit({ ...git, [k]: newV });
					}}
					onValidate={(value: string) => onValidate(k, value)}
				/>
			))}
		</>
	);
};

export default GitField;

const getGitData = (obj: any) =>
	Object.entries(obj).reduce((acc, [k, v]) => {
		if (k.startsWith('git')) return { ...acc, [k]: v };
		return acc;
	}, {});
