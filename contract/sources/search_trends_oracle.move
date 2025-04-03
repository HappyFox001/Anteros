module anteros::search_trends_oracle {
    use std::string::String;
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::table;
    use aptos_framework::account;
    use std::string;
    const E_NOT_INITIALIZED: u64 = 1;
    const E_DATA_NOT_FOUND: u64 = 2;
    const E_STALE_DATA: u64 = 3;

    struct TrendData has store, drop, copy {
        realtime_value: u64,
        monthly_value: u64,
        last_updated: u64,
        note: String
    }

    struct TrendUpdateEvent has drop, store {
        keyword: String,
        realtime_value: u64,
        monthly_value: u64,
        timestamp: u64
    }

    struct SearchTrendsOracle has key {
        trends: table::Table<String, TrendData>,
        update_events: event::EventHandle<TrendUpdateEvent>
    }

    public fun is_initialized(addr: address): bool {
        exists<SearchTrendsOracle>(addr)
    }

    public fun initialize(account: &signer) {
        let trends = table::new<String, TrendData>();

        // Add initial test data
        let current_time = timestamp::now_seconds();

        // Bitcoin data
        table::add(
            &mut trends,
            string::utf8(b"bitcoin"),
            TrendData {
                realtime_value: 85,
                monthly_value: 75,
                last_updated: current_time,
                note: string::utf8(b"Initial bitcoin data")
            }
        );

        // Ethereum data
        table::add(
            &mut trends,
            string::utf8(b"ethereum"),
            TrendData {
                realtime_value: 80,
                monthly_value: 70,
                last_updated: current_time,
                note: string::utf8(b"Initial ethereum data")
            }
        );

        // NFT data
        table::add(
            &mut trends,
            string::utf8(b"nft"),
            TrendData {
                realtime_value: 60,
                monthly_value: 65,
                last_updated: current_time,
                note: string::utf8(b"Initial NFT data")
            }
        );

        move_to(
            account,
            SearchTrendsOracle {
                trends,
                update_events: account::new_event_handle<TrendUpdateEvent>(account)
            }
        );
    }

    public entry fun update_trend_data(
        account: &signer,
        keyword: String,
        realtime_value: u64,
        monthly_value: u64,
        note: String
    ) acquires SearchTrendsOracle {
        let account_addr = signer::address_of(account);

        let oracle = borrow_global_mut<SearchTrendsOracle>(account_addr);
        let current_time = timestamp::now_seconds();

        let new_trend_data = TrendData {
            realtime_value,
            monthly_value,
            last_updated: current_time,
            note
        };

        table::upsert(&mut oracle.trends, keyword, new_trend_data);

        event::emit_event(
            &mut oracle.update_events,
            TrendUpdateEvent {
                keyword,
                realtime_value,
                monthly_value,
                timestamp: current_time
            }
        );
    }

    public fun get_trend_data(
        oracle_addr: address, keyword: String
    ): (u64, u64, u64, String) acquires SearchTrendsOracle {
        assert!(exists<SearchTrendsOracle>(oracle_addr), E_NOT_INITIALIZED);
        let oracle = borrow_global_mut<SearchTrendsOracle>(oracle_addr);
        
        // If keyword does not exist, create default data
        if (!table::contains(&oracle.trends, keyword)) {
            let current_time = timestamp::now_seconds();
            
            // Create default data
            let default_realtime_value = 100;
            let default_monthly_value = 100;
            let default_note = string::utf8(b"Auto-generated default data");
            
            // Adjust default values based on keyword to make different keywords have different initial prices
            let keyword_bytes = string::bytes(&keyword);
            let keyword_length = vector::length(keyword_bytes);
            
            // Use keyword length as a random seed to generate some variation
            if (keyword_length > 0) {
                let seed = (keyword_length as u64) * 5;
                default_realtime_value = 80 + seed % 40; // Range 80-120
                default_monthly_value = 85 + seed % 30; // Range 85-115
            };
            
            let new_trend_data = TrendData {
                realtime_value: default_realtime_value,
                monthly_value: default_monthly_value,
                last_updated: current_time,
                note: default_note
            };
            
            table::add(&mut oracle.trends, keyword, new_trend_data);
            
            // Emit event
            event::emit_event(
                &mut oracle.update_events,
                TrendUpdateEvent {
                    keyword: copy keyword,
                    realtime_value: default_realtime_value,
                    monthly_value: default_monthly_value,
                    timestamp: current_time
                }
            );
        };
        
        let trend_data = table::borrow(&oracle.trends, keyword);
        (
            trend_data.realtime_value,
            trend_data.monthly_value,
            trend_data.last_updated,
            trend_data.note
        )
    }

    public fun is_data_stale(
        oracle_addr: address, keyword: String, max_age_seconds: u64
    ): bool acquires SearchTrendsOracle {
        let (_, _, last_updated, _) = get_trend_data(oracle_addr, keyword);
        let current_time = timestamp::now_seconds();

        (current_time - last_updated) > max_age_seconds
    }

    public fun get_fresh_trend_data(
        oracle_addr: address, keyword: String, max_age_seconds: u64
    ): (u64, u64, String) acquires SearchTrendsOracle {
        let (realtime_value, monthly_value, last_updated, note) =
            get_trend_data(oracle_addr, keyword);
        let current_time = timestamp::now_seconds();

        assert!(
            (current_time - last_updated) <= max_age_seconds,
            E_STALE_DATA
        );

        (realtime_value, monthly_value, note)
    }

    public fun get_monthly_decimal(monthly_value: u64): (u64, u64) {
        let integer_part = monthly_value / 10;
        let decimal_part = monthly_value % 10;

        (integer_part, decimal_part)
    }
}
