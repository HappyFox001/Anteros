#[test_only]
module anteros::search_trends_oracle_tests {
    use std::string;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use anteros::search_trends_oracle;

    const KEYWORD: vector<u8> = b"bitcoin";
    const REALTIME_VALUE: u64 = 85;
    const MONTHLY_VALUE: u64 = 75;
    const NOTE: vector<u8> = b"Test note";
    const MAX_AGE_SECONDS: u64 = 3600;

    fun create_test_signer(): signer {
        let anteros_account = account::create_account_for_test(@anteros);

        let framework_account = account::create_account_for_test(@aptos_framework);
        timestamp::set_time_has_started_for_testing(&framework_account);

        timestamp::update_global_time_for_test_secs(1);

        anteros_account
    }

    #[test]
    fun test_initialize() {
        let account = create_test_signer();
        search_trends_oracle::initialize(&account);
    }

    #[test]
    fun test_update_and_get_trend_data() {
        let account = create_test_signer();
        search_trends_oracle::initialize(&account);

        let keyword = string::utf8(KEYWORD);
        let note = string::utf8(NOTE);
        search_trends_oracle::update_trend_data(
            &account,
            keyword,
            REALTIME_VALUE,
            MONTHLY_VALUE,
            note
        );

        let (realtime, monthly, last_updated, returned_note) =
            search_trends_oracle::get_trend_data(@anteros, string::utf8(KEYWORD));

        assert!(realtime == REALTIME_VALUE, 0);
        assert!(monthly == MONTHLY_VALUE, 1);
        assert!(last_updated > 0, 2);
        assert!(string::bytes(&returned_note) == &NOTE, 3);
    }

    #[test]
    fun test_is_data_stale() {
        let account = create_test_signer();
        search_trends_oracle::initialize(&account);

        search_trends_oracle::update_trend_data(
            &account,
            string::utf8(KEYWORD),
            REALTIME_VALUE,
            MONTHLY_VALUE,
            string::utf8(NOTE)
        );

        let is_stale =
            search_trends_oracle::is_data_stale(
                @anteros,
                string::utf8(KEYWORD),
                MAX_AGE_SECONDS
            );
        assert!(!is_stale, 4);
    }

    #[test]
    fun test_get_fresh_trend_data() {
        let account = create_test_signer();
        search_trends_oracle::initialize(&account);

        search_trends_oracle::update_trend_data(
            &account,
            string::utf8(KEYWORD),
            REALTIME_VALUE,
            MONTHLY_VALUE,
            string::utf8(NOTE)
        );

        let (realtime, monthly, note) =
            search_trends_oracle::get_fresh_trend_data(
                @anteros,
                string::utf8(KEYWORD),
                MAX_AGE_SECONDS
            );

        assert!(realtime == REALTIME_VALUE, 5);
        assert!(monthly == MONTHLY_VALUE, 6);
        assert!(string::bytes(&note) == &NOTE, 7);
    }

    #[test]
    fun test_get_monthly_decimal() {
        let monthly_value = 75;
        let (integer_part, decimal_part) =
            search_trends_oracle::get_monthly_decimal(monthly_value);
        assert!(integer_part == 7, 8);
        assert!(decimal_part == 5, 9);
    }

    #[test]
    #[expected_failure(abort_code = 1, location = anteros::search_trends_oracle)]
    fun test_get_trend_data_unauthorized() {
        let (_, _, _, _) =
            search_trends_oracle::get_trend_data(@anteros, string::utf8(KEYWORD));
    }

    #[test]
    #[expected_failure(abort_code = 2, location = anteros::search_trends_oracle)]
    fun test_get_trend_data_not_found() {
        let account = create_test_signer();
        search_trends_oracle::initialize(&account);
        let (_, _, _, _) =
            search_trends_oracle::get_trend_data(@anteros, string::utf8(b"nonexistent"));
    }
}
