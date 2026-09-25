import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
    "https://fvhcqbmltvroabxgqkdm.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_udIFSVCPr-3cLFw4U33DJA_0_A_EA1x";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
