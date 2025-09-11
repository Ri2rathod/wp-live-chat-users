<?php

namespace WPLCAPP\baseClasses;

use function Kucrut\Vite\enqueue_asset;


/**
 * The code that runs during plugin activation
 */
defined('ABSPATH') or die('Something went wrong');
/**
 * Shortcode Manager with Vite Integration
 * 
 * A reusable OOP approach to WordPress shortcodes with modern asset management.
 */


class WPLCShortcodeManager
{

    /**
     * Registered shortcodes
     * 
     * @var array
     */
    private $shortcodes = [];

    /**
     * Vite build directory
     * 
     * @var string
     */
    private $vite_build_dir;

    private $used_shortcodes;
    /**
     * Constructor
     * 
     * @param string $vite_build_dir Path to Vite build directory
     */
    public function __construct($vite_build_dir)
    {
        $this->vite_build_dir = $vite_build_dir;

        // Hook into WordPress
        add_action('init', [$this, 'register_shortcodes']);
        add_action('wp_footer', [$this, 'maybe_enqueue_assets']);
    }

    /**
     * Register a new shortcode
     * 
     * @param string   $tag      Shortcode tag
     * @param callable $callback Render callback
     * @param array    $assets   Vite assets to enqueue
     * @param array    $args     Additional arguments
     */
    public function register($tag, $callback, $assets = [], $args = [])
    {
        $defaults = [
            'condition' => null, // Optional condition to check before enqueuing assets
        ];

        $this->shortcodes[$tag] = wp_parse_args($args, $defaults);
        $this->shortcodes[$tag]['callback'] = $callback;
        $this->shortcodes[$tag]['assets'] = $assets;
    }

    /**
     * Register all shortcodes with WordPress
     */
    public function register_shortcodes()
    {
        foreach ($this->shortcodes as $tag => $config) {
            add_shortcode($tag, [$this, 'render_shortcode']);
        }
    }

    /**
     * Render a shortcode
     * 
     * @param array  $atts    Shortcode attributes
     * @param string $content Shortcode content
     * @param string $tag     Shortcode tag
     * 
     * @return string Rendered shortcode
     */
    public function render_shortcode($atts, $content = null, $tag = '')
    {
        if (!isset($this->shortcodes[$tag])) {
            return '';
        }

        $config = $this->shortcodes[$tag];

        // Mark this shortcode as used on the page
        if (!isset($this->used_shortcodes)) {
            $this->used_shortcodes = [];
        }
        $this->used_shortcodes[$tag] = true;

        // Call the render callback
        return call_user_func($config['callback'], $atts, $content, $tag);
    }

    /**
     * Enqueue assets for shortcodes used on the page
     */
    public function maybe_enqueue_assets()
    {
        if (empty($this->used_shortcodes)) {
            return;
        }

        foreach ($this->used_shortcodes as $tag => $value) {
            if (!isset($this->shortcodes[$tag])) {
                continue;
            }

            $config = $this->shortcodes[$tag];

            // Check condition if provided
            if (is_callable($config['condition']) && !call_user_func($config['condition'])) {
                continue;
            }

            // Enqueue assets
            if (!empty($config['assets'])) {
                foreach ($config['assets'] as $asset) {
                    $this->enqueue_asset($asset);
                }
            }
        }
    }

    /**
     * Enqueue a Vite asset
     * 
     * @param array $asset Asset configuration
     */
    private function enqueue_asset($asset)
    {
        $defaults = [
            'entry' => '',
            'handle' => '',
            'dependencies' => [],
            'in_footer' => true,
        ];


        $asset = wp_parse_args($asset, $defaults);

        if (empty($asset['entry']) || empty($asset['handle'])) {
            return;
        }

        enqueue_asset(
            $this->vite_build_dir,
            $asset['entry'],
            [
                'handle' => $asset['handle'],
                'dependencies' => $asset['dependencies'],
                'in-footer' => $asset['in_footer'],
            ]
        );
    }
}