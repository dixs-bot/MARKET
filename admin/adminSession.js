(async function () {

    const {
        data: { user }
    } =
    await window.supabaseClient
        .auth
        .getUser();

    if (!user) {

        window.location.href =
            '/admin/login.html';

        return;
    }

    const {
        data: profile,
        error
    } =
    await window.supabaseClient
        .from('admin_profiles')
        .select(`
            role,
            store_id
        `)
        .eq('user_id', user.id)
        .single();

    if (error || !profile) {

        console.error(
            'Admin profile not found'
        );

        return;
    }

    window.AdminSession = {

        user_id:
            user.id,

        role:
            profile.role,

        store_id:
            profile.store_id
    };

    console.log(
        'ADMIN SESSION:',
        window.AdminSession
    );

})();
