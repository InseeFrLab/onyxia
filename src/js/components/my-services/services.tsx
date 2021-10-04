import { useEffect, useState } from "react";
import Loader from "../commons/loader";
import Cards from "./cards";
import Toolbar from "./toolbar";
import { Service, Group } from "js/model";
import { getServices, deleteServices } from "js/api/my-lab";
import { useSelector } from "app/interfaceWithLib";

interface Props {
    groupId?: string;
}

const Services = ({ groupId }: Props) => {
    const [services, setServices] = useState<Service[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const userPassword = useSelector(
        state => state.userConfigs.userServicePassword.value,
    );

    const loadData = (groupId?: String) => {
        setLoading(true);
        getServices(groupId).then(servicesResp => {
            setServices(servicesResp.apps);
            setGroups(servicesResp.groups);
            setLoading(false);
        });
    };

    const deleteAllServices = () => {
        setLoading(true);
        deleteServices(groupId, true).then(() => {
            setLoading(false);
            loadData();
        });
    };

    useEffect(() => {
        loadData(groupId);
    }, [groupId]);

    const filteredGroups =
        groups && groups.filter(group => group.apps && group.apps.length > 0);

    return (
        <div className="contenu accueil">
            <Toolbar
                userPassword={userPassword}
                hasService={
                    (services && services.length > 0) ||
                    (filteredGroups && filteredGroups.length > 0)
                }
                handleRefresh={() => loadData(groupId)}
                handleDeleteAll={deleteAllServices}
            />
            {loading ? (
                <Loader em={18} />
            ) : (
                <Cards services={services} groups={filteredGroups} />
            )}
        </div>
    );
};

export default Services;
