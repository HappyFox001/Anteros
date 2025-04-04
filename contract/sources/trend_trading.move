/**
 * @title Trend Trading Smart Contract
 * @dev This module implements a decentralized trading platform for keyword trend positions
 *
 * The Trend Trading contract allows users to open long or short positions on keyword popularity trends.
 * It integrates with the Search Trends Oracle to fetch real-time and monthly trend data for keywords,
 * which are used to calculate spot prices. The contract manages position sizes, entry prices, and
 * calculates funding rates based on the deviation between contract and spot prices.
 *
 * Key features:
 * - Position management: Users can open long/short positions on keyword trends
 * - Dynamic pricing: Prices are derived from oracle data with adjustments for market impact
 * - Funding rate mechanism: Helps maintain price alignment with the underlying trend data
 * - View functions: Provides visibility into contract state, positions, and price calculations
 */
module anteros::trend_trading {
    use std::error;
    use std::signer;
    use std::string;
    use aptos_std::table::{Self, Table};
    use anteros::search_trends_oracle;
    use std::string::String;

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;

    const REALTIME_WEIGHT: u64 = 60;
    const MONTHLY_WEIGHT: u64 = 40;
    const BASIS_POINTS: u64 = 1000;
    const MAX_FEE_RATE: u64 = 100;

    struct TradingState has key {
        contract_price: u64,
        total_long_positions: u64,
        total_short_positions: u64,
        positions: Table<address, Position>,
        admin: address
    }

    struct Position has store, drop {
        size: u64,
        is_long: bool,
        entry_price: u64
    }

    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(
            !exists<TradingState>(admin_addr),
            error::already_exists(E_ALREADY_INITIALIZED)
        );
        search_trends_oracle::initialize(admin);
        move_to(
            admin,
            TradingState {
                contract_price: 0,
                total_long_positions: 0,
                total_short_positions: 0,
                positions: table::new(),
                admin: admin_addr
            }
        );
    }

    #[view]
    public fun get_spot_price(keyword: String): u64 {
        if (!search_trends_oracle::is_initialized(@anteros)) {
            return 100
        };

        let (realtime, monthly, _, _) =
            search_trends_oracle::get_trend_data(@anteros, keyword);

        ((realtime * REALTIME_WEIGHT) + (monthly * MONTHLY_WEIGHT)) / 100
    }

    public entry fun open_position(
        account: &signer,
        keyword: String,
        size: u64,
        is_long: bool
    ) acquires TradingState {
        let account_addr = signer::address_of(account);

        if (!search_trends_oracle::is_initialized(@anteros)) {
            search_trends_oracle::initialize(account);
            search_trends_oracle::update_trend_data(
                account,
                keyword,
                85,
                75,
                string::utf8(b"Initial data")
            );
        };

        let state = borrow_global_mut<TradingState>(@anteros);
        let spot_price = get_spot_price(keyword);
        let impact = calculate_price_impact(size, is_long);

        if (is_long) {
            state.total_long_positions = state.total_long_positions + size;
            state.contract_price = spot_price + impact;
        } else {
            state.total_short_positions = state.total_short_positions + size;
            state.contract_price =
                if (spot_price > impact) {
                    spot_price - impact
                } else { 1 };
        };

        let position = Position { size, is_long, entry_price: state.contract_price };
        table::upsert(&mut state.positions, account_addr, position);
    }

    #[view]
    public fun calculate_price_impact(size: u64, _is_long: bool): u64 {
        let impact = size / 100;
        if (impact > 50) { 50 }
        else { impact }
    }

    #[view]
    public fun calculate_funding_rate(keyword: String): u64 acquires TradingState {
        let state = borrow_global<TradingState>(@anteros);
        let spot_price = get_spot_price(keyword);

        if (spot_price == 0 || state.contract_price == 0) {
            return 0
        };

        let deviation =
            if (state.contract_price > spot_price) {
                ((state.contract_price - spot_price) * BASIS_POINTS) / spot_price
            } else {
                ((spot_price - state.contract_price) * BASIS_POINTS) / spot_price
            };

        if (deviation > MAX_FEE_RATE) {
            MAX_FEE_RATE
        } else {
            deviation
        }
    }

    #[view]
    public fun get_contract_price(): u64 acquires TradingState {
        borrow_global<TradingState>(@anteros).contract_price
    }

    #[view]
    public fun get_position(user: address): (u64, bool, u64) acquires TradingState {
        let state = borrow_global<TradingState>(@anteros);
        if (!table::contains(&state.positions, user)) {
            return (0, false, 0)
        };
        let position = table::borrow(&state.positions, user);
        (position.size, position.is_long, position.entry_price)
    }
}
