export const sendSegment = async (data) => {
    const payload = {
        segment: data.segment,
        played_at: data.played_at,
        service: 'BBC',
    };

    try {
        const response = await fetch('https://www.bowie.test/api/listens', {
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
