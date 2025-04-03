#[test_only]
module anteros::trend_trading_tests {
    use std::string;
    use std::debug;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use anteros::trend_trading;
    use anteros::search_trends_oracle;

    const KEYWORD: vector<u8> = b"bitcoin";
    const POSITION_SIZE: u64 = 10;
    const REALTIME_VALUE: u64 = 85;
    const MONTHLY_VALUE: u64 = 75;
    const NOTE: vector<u8> = b"Test note";

    fun setup_test_env(): (signer, signer) {
        let admin = account::create_account_for_test(@anteros);

        let framework_account = account::create_account_for_test(@aptos_framework);
        timestamp::set_time_has_started_for_testing(&framework_account);
        timestamp::update_global_time_for_test_secs(1);

        search_trends_oracle::initialize(&admin);

        search_trends_oracle::update_trend_data(
            &admin,
            string::utf8(KEYWORD),
            REALTIME_VALUE,
            MONTHLY_VALUE,
            string::utf8(NOTE)
        );

        let test_user = account::create_account_for_test(@0xCAFE);

        (admin, test_user)
    }

    #[test]
    fun test_initialize() {
        let (admin, _) = setup_test_env();
        trend_trading::initialize(&admin);

        assert!(trend_trading::get_contract_price() == 0, 0);

        let (size, is_long, entry_price) = trend_trading::get_position(@0xCAFE);
        assert!(size == 0, 1);
        assert!(!is_long, 2);
        assert!(entry_price == 0, 3);
    }

    #[test]
    fun test_get_spot_price() {
        let (admin, _) = setup_test_env();
        trend_trading::initialize(&admin);

        let spot_price = trend_trading::get_spot_price(string::utf8(KEYWORD));

        assert!(spot_price == 81, 4);
    }

    #[test]
    fun test_open_long_position() {
        let (admin, user) = setup_test_env();
        trend_trading::initialize(&admin);

        trend_trading::open_position(
            &user,
            string::utf8(KEYWORD),
            POSITION_SIZE,
            true
        );

        let (size, is_long, entry_price) = trend_trading::get_position(@0xCAFE);
        assert!(size == POSITION_SIZE, 5);
        assert!(is_long, 6);
        assert!(entry_price > 0, 7);

        assert!(trend_trading::get_contract_price() > 0, 8);
    }

    #[test]
    fun test_open_short_position() {
        let (admin, user) = setup_test_env();
        trend_trading::initialize(&admin);

        trend_trading::open_position(
            &user,
            string::utf8(KEYWORD),
            POSITION_SIZE,
            false
        );

        let (size, is_long, entry_price) = trend_trading::get_position(@0xCAFE);
        assert!(size == POSITION_SIZE, 9);
        assert!(!is_long, 10);
        assert!(entry_price > 0, 11);

        assert!(trend_trading::get_contract_price() > 0, 12);
    }

    #[test]
    fun test_calculate_funding_rate() {
        let (admin, user) = setup_test_env();
        trend_trading::initialize(&admin);

        trend_trading::open_position(
            &user,
            string::utf8(KEYWORD),
            POSITION_SIZE,
            true
        );

        let funding_rate = trend_trading::calculate_funding_rate(string::utf8(KEYWORD));

        assert!(funding_rate <= 100, 13);
        assert!(funding_rate >= 0, 14);
    }

    #[test]
    fun test_price_impact_and_funding_rate() {
        let (admin, user) = setup_test_env();
        trend_trading::initialize(&admin);
        let initial_spot = trend_trading::get_spot_price(string::utf8(KEYWORD));
        debug::print(&b"Initial spot price:");
        debug::print(&initial_spot);

        trend_trading::open_position(
            &user,
            string::utf8(KEYWORD),
            POSITION_SIZE * 10,
            true
        );

        let contract_price = trend_trading::get_contract_price();
        debug::print(&b"Contract price after long position:");
        debug::print(&contract_price);

        let funding_rate = trend_trading::calculate_funding_rate(string::utf8(KEYWORD));
        debug::print(&b"Funding rate (basis points):");
        debug::print(&funding_rate);

        trend_trading::open_position(
            &user,
            string::utf8(KEYWORD),
            POSITION_SIZE * 15,
            false
        );

        let new_contract_price = trend_trading::get_contract_price();
        debug::print(&b"Contract price after short position:");
        debug::print(&new_contract_price);

        let new_funding_rate =
            trend_trading::calculate_funding_rate(string::utf8(KEYWORD));
        debug::print(&b"New funding rate (basis points):");
        debug::print(&new_funding_rate);

        assert!(contract_price > initial_spot, 15);
        assert!(new_contract_price < contract_price, 16);
    }
}
