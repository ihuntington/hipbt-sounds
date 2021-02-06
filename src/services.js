const { SNOWPACK_PUBLIC_BOWIE_URL } = import.meta.env;

export const sendSegment = async (data) => {
    const payload = {
        segment: data.segment,
        played_at: data.played_at,
        service: 'BBC',
    };

    try {
        const response = await fetch(`${SNOWPACK_PUBLIC_BOWIE_URL}/api/listens`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            console.log('Send segment success');
        }
    } catch (error) {
        console.error('Send segment error', error);
    }
};
