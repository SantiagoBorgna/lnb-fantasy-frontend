import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { encodeId } from '../../utils/urlParams';

export default function RedirectTorneo() {
    const { id, '*': subpath } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            const hash = encodeId(id);
            navigate(`/t/${hash}/${subpath || ''}`, { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    }, [id, subpath, navigate]);

    return null;
}
