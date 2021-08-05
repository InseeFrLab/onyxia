import { useState, useEffect } from "react";
import { CardMyService } from "js/components/commons/service-card";
import { Service } from "js/model";
import { getService } from "js/api/my-lab";
import { sleep } from "js/utils";

const refresh = (id: string) => (status: string) => (onChange: (a: Service) => void) => {
    if (status === "DEPLOYING") {
        sleep(5000).then(() => {
            getService(id).then(service => {
                if (service && service.status !== "DEPLOYING") onChange(service);
                if (service) refresh(id)(service.status)(onChange);
            });
        });
    }
};

interface Props {
    service: Service;
}

const CardChecker = ({ service }: Props) => {
    const [checkedService, setCheckedService] = useState<Service>(service);
    const { id, status } = service;

    useEffect(() => {
        refresh(id)(status)(setCheckedService);
    }, [id, status]);

    return <CardMyService service={checkedService} />;
};

export default CardChecker;
